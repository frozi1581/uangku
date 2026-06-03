<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\TransactionUsage;
use App\Services\JournalPoster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $q = PurchaseOrder::with('vendor:id,name')->orderBy('date')->orderBy('id');
        if ($request->filled('status')) $q->where('status', $request->status);
        if ($request->filled('vendor_id')) $q->where('vendor_id', $request->vendor_id);
        if ($request->filled('from')) $q->whereDate('date', '>=', $request->from);
        if ($request->filled('to')) $q->whereDate('date', '<=', $request->to);

        return response()->json($q->paginate(20));
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return response()->json($purchaseOrder->load('items', 'vendor:id,name'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id' => ['nullable', 'exists:vendors,id'],
            'vendor_name' => ['nullable', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (empty($data['vendor_id']) && empty($data['vendor_name'])) {
            return response()->json(['message' => 'Vendor wajib dipilih atau diketik.', 'errors' => ['vendor_name' => ['Vendor wajib diisi.']]], 422);
        }

        $companyId = $request->user()->company_id;
        if (! $companyId) {
            return response()->json(['message' => 'Akun ini tidak terhubung ke perusahaan (super admin tidak dapat membuat transaksi).'], 422);
        }
        if (! \App\Models\AccountingPeriod::isOpenForDate($companyId, $data['date'])) {
            return response()->json(['message' => 'Periode tanggal tersebut sudah ditutup. Hanya periode berjalan yang dapat diisi.'], 422);
        }

        $po = DB::transaction(function () use ($data, $companyId) {
            // Resolusi vendor: pakai id, atau cari/auto-create berdasarkan nama.
            $vendorId = $data['vendor_id'] ?? null;
            if (! $vendorId) {
                $name = trim($data['vendor_name']);
                $vendor = \App\Models\Vendor::firstOrCreate(
                    ['company_id' => $companyId, 'name' => $name],
                    ['is_active' => true]
                );
                $vendorId = $vendor->id;
            }

            $subtotal = 0;
            $tax = 0;
            $lines = [];
            foreach ($data['items'] as $it) {
                $base = $it['quantity'] * $it['unit_price'];
                $lineTax = $base * (($it['tax_rate'] ?? 0) / 100);
                $subtotal += $base;
                $tax += $lineTax;
                $lines[] = [
                    'description' => $it['description'],
                    'quantity' => $it['quantity'],
                    'unit_price' => $it['unit_price'],
                    'tax_rate' => $it['tax_rate'] ?? 0,
                    'line_total' => $base + $lineTax,
                ];
            }
            $total = $subtotal + $tax;

            $po = PurchaseOrder::create([
                'company_id' => $companyId,
                'po_no' => 'PO-' . now()->format('Ym') . '-' . str_pad((string) (PurchaseOrder::withoutGlobalScopes()->where('company_id', $companyId)->count() + 1), 4, '0', STR_PAD_LEFT),
                'vendor_id' => $vendorId,
                'date' => $data['date'],
                'expected_date' => $data['expected_date'] ?? null,
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'total' => $total,
                'status' => 'approved',
                'notes' => $data['notes'] ?? null,
            ]);
            $po->items()->createMany(array_map(fn ($l) => $l + ['company_id' => $companyId], $lines));

            // Jurnal: D Beban Operasional (5103) + PPN Masukan (1106) ; K Hutang Usaha (2101)
            JournalPoster::post($companyId, $data['date'], 'purchase_order', $po->id, "PO {$po->po_no}", [
                ['code' => '5103', 'debit' => $subtotal, 'credit' => 0],
                ['code' => '1106', 'debit' => $tax, 'credit' => 0],
                ['code' => '2101', 'debit' => 0, 'credit' => $total],
            ]);

            TransactionUsage::recordUsage($companyId, 'po');

            return $po;
        });

        return response()->json($po->load('items'), 201);
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if (! \App\Models\AccountingPeriod::isOpenForDate($purchaseOrder->company_id, (string) $purchaseOrder->date->format('Y-m-d'))) {
            return response()->json(['message' => 'Tidak bisa menghapus: periode PO ini sudah ditutup.'], 422);
        }
        DB::transaction(function () use ($purchaseOrder) {
            \App\Models\Journal::withoutGlobalScopes()
                ->where('company_id', $purchaseOrder->company_id)
                ->where('source_type', 'purchase_order')->where('source_id', $purchaseOrder->id)->delete();
            $purchaseOrder->delete();
        });
        return response()->json(['message' => 'PO dihapus.']);
    }
}
