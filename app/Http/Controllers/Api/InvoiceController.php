<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\TransactionUsage;
use App\Services\JournalPoster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $q = Invoice::with('customer:id,name')->orderBy('date')->orderBy('id');
        if ($request->filled('status')) $q->where('status', $request->status);
        if ($request->filled('customer_id')) $q->where('customer_id', $request->customer_id);
        if ($request->filled('from')) $q->whereDate('date', '>=', $request->from);
        if ($request->filled('to')) $q->whereDate('date', '<=', $request->to);

        return response()->json($q->paginate(20));
    }

    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load('items', 'customer:id,name'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'tax_rate' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (empty($data['customer_id']) && empty($data['customer_name'])) {
            return response()->json(['message' => 'Pelanggan wajib dipilih atau diketik.', 'errors' => ['customer_name' => ['Pelanggan wajib diisi.']]], 422);
        }

        $companyId = $request->user()->company_id;
        if (! $companyId) {
            return response()->json(['message' => 'Akun ini tidak terhubung ke perusahaan (super admin tidak dapat membuat transaksi).'], 422);
        }
        if (! \App\Models\AccountingPeriod::isOpenForDate($companyId, $data['date'])) {
            return response()->json(['message' => 'Periode tanggal tersebut sudah ditutup. Hanya periode berjalan yang dapat diisi.'], 422);
        }

        $invoice = DB::transaction(function () use ($data, $companyId) {
            // Resolusi pelanggan: pakai id, atau cari/auto-create berdasarkan nama.
            $customerId = $data['customer_id'] ?? null;
            if (! $customerId) {
                $name = trim($data['customer_name']);
                $customer = \App\Models\Customer::firstOrCreate(
                    ['company_id' => $companyId, 'name' => $name],
                    ['is_active' => true]
                );
                $customerId = $customer->id;
            }

            // PPN dokumen (pindah ke bawah): satu tarif untuk seluruh subtotal.
            // Jika 'tax_rate' tingkat-dokumen dikirim, pakai itu; jika tidak, fallback ke tax_rate per-baris (kompatibilitas lama).
            $docTaxRate = $data['tax_rate'] ?? null;
            $subtotal = 0;
            $tax = 0;
            $lines = [];
            foreach ($data['items'] as $it) {
                $lineBase = $it['quantity'] * $it['unit_price'];
                $subtotal += $lineBase;
                $lineTax = 0;
                if ($docTaxRate === null) {
                    // mode lama: PPN per-baris
                    $lineTax = $lineBase * (($it['tax_rate'] ?? 0) / 100);
                    $tax += $lineTax;
                }
                $lines[] = [
                    'description' => $it['description'],
                    'quantity' => $it['quantity'],
                    'unit_price' => $it['unit_price'],
                    'tax_rate' => $docTaxRate === null ? ($it['tax_rate'] ?? 0) : 0,
                    'line_total' => $lineBase + $lineTax,
                ];
            }
            if ($docTaxRate !== null) {
                $tax = round($subtotal * ($docTaxRate / 100), 2);
            }
            $total = $subtotal + $tax;

            $invoice = Invoice::create([
                'company_id' => $companyId,
                'invoice_no' => 'INV-' . now()->format('Ym') . '-' . str_pad((string) (Invoice::withoutGlobalScopes()->where('company_id', $companyId)->count() + 1), 4, '0', STR_PAD_LEFT),
                'customer_id' => $customerId,
                'date' => $data['date'],
                'due_date' => $data['due_date'] ?? null,
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'total' => $total,
                'status' => 'sent',
                'notes' => $data['notes'] ?? null,
            ]);
            $invoice->items()->createMany(array_map(fn ($l) => $l + ['company_id' => $companyId], $lines));

            // Jurnal: D Piutang Usaha (1104) ; K Pendapatan Penjualan (4101) + PPN Keluaran (2102)
            JournalPoster::post($companyId, $data['date'], 'invoice', $invoice->id, "Invoice {$invoice->invoice_no}", [
                ['code' => '1104', 'debit' => $total, 'credit' => 0],
                ['code' => '4101', 'debit' => 0, 'credit' => $subtotal],
                ['code' => '2102', 'debit' => 0, 'credit' => $tax],
            ]);

            TransactionUsage::recordUsage($companyId, 'invoice');

            return $invoice;
        });

        return response()->json($invoice->load('items'), 201);
    }

    public function destroy(Invoice $invoice)
    {
        if (! \App\Models\AccountingPeriod::isOpenForDate($invoice->company_id, (string) $invoice->date->format('Y-m-d'))) {
            return response()->json(['message' => 'Tidak bisa menghapus: periode invoice ini sudah ditutup.'], 422);
        }
        if ((float) $invoice->paid_amount > 0.009) {
            return response()->json(['message' => 'Tidak bisa menghapus: invoice ini sudah memiliki penerimaan/pencairan. Batalkan pembayaran dulu.'], 422);
        }
        DB::transaction(function () use ($invoice) {
            // hapus jurnal terkait agar laporan tetap konsisten
            \App\Models\Journal::withoutGlobalScopes()
                ->where('company_id', $invoice->company_id)
                ->where('source_type', 'invoice')->where('source_id', $invoice->id)->delete();
            $invoice->delete();
        });
        return response()->json(['message' => 'Invoice dihapus.']);
    }
}
