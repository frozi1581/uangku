<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\Invoice;
use App\Models\Journal;
use App\Models\Payment;
use App\Models\PurchaseOrder;
use App\Services\JournalPoster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    // Daftar pembayaran. Filter: payable_type (invoice|purchase_order), payable_id, from, to.
    public function index(Request $request)
    {
        $q = Payment::with('bankAccount:id,bank_name,account_number')
            ->orderBy('date')->orderBy('id');
        if ($request->filled('payable_type')) $q->where('payable_type', $request->payable_type);
        if ($request->filled('payable_id')) $q->where('payable_id', $request->payable_id);
        if ($request->filled('from')) $q->whereDate('date', '>=', $request->from);
        if ($request->filled('to')) $q->whereDate('date', '<=', $request->to);

        return response()->json($q->paginate(50));
    }

    // Buat pembayaran. body: payable_type, payable_id, bank_account_id, date, amount, reference?, notes?
    public function store(Request $request)
    {
        $data = $request->validate([
            'payable_type' => ['required', 'in:invoice,purchase_order'],
            'payable_id' => ['required', 'integer'],
            'bank_account_id' => ['required', 'exists:bank_accounts,id'],
            'date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $companyId = $request->user()->company_id;
        if (! $companyId) {
            return response()->json(['message' => 'Akun ini tidak terhubung ke perusahaan (super admin tidak dapat membuat transaksi).'], 422);
        }
        if (! \App\Models\AccountingPeriod::isOpenForDate($companyId, $data['date'])) {
            return response()->json(['message' => 'Periode tanggal tersebut sudah ditutup. Hanya periode berjalan yang dapat diisi.'], 422);
        }

        // Ambil dokumen yang dibayar (scoped ke company aktif lewat global scope).
        $doc = $data['payable_type'] === 'invoice'
            ? Invoice::find($data['payable_id'])
            : PurchaseOrder::find($data['payable_id']);
        if (! $doc) {
            return response()->json(['message' => 'Dokumen yang dibayar tidak ditemukan.'], 404);
        }

        $outstanding = (float) $doc->total - (float) $doc->paid_amount;
        if ($outstanding <= 0) {
            return response()->json(['message' => 'Dokumen ini sudah lunas.'], 422);
        }
        if ($data['amount'] - $outstanding > 0.001) {
            return response()->json(['message' => 'Jumlah pembayaran melebihi sisa tagihan (' . number_format($outstanding, 2) . ').'], 422);
        }

        $payment = DB::transaction(function () use ($data, $companyId, $doc) {
            $account = BankAccount::findOrFail($data['bank_account_id']);
            $amount = (float) $data['amount'];
            $isInvoice = $data['payable_type'] === 'invoice';

            // Arah kas: invoice = uang MASUK (piutang cair); PO = uang KELUAR (bayar hutang).
            $direction = $isInvoice ? 'in' : 'out';
            $delta = $isInvoice ? $amount : -$amount;
            $account->current_balance += $delta;
            $account->save();

            $payment = Payment::create([
                'company_id' => $companyId,
                'payment_no' => ($isInvoice ? 'RCV-' : 'PAY-') . now()->format('Ym') . '-' . str_pad((string) (Payment::withoutGlobalScopes()->where('company_id', $companyId)->count() + 1), 4, '0', STR_PAD_LEFT),
                'payable_type' => $data['payable_type'],
                'payable_id' => $doc->id,
                'bank_account_id' => $account->id,
                'date' => $data['date'],
                'amount' => $amount,
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            // Jurnal:
            // Invoice (penerimaan piutang): D Bank (1103) ; K Piutang Usaha (1104)
            // PO (pembayaran hutang):       D Hutang Usaha (2101) ; K Bank (1103)
            $docNo = $isInvoice ? $doc->invoice_no : $doc->po_no;
            $desc = $isInvoice ? "Penerimaan {$docNo}" : "Pembayaran {$docNo}";
            $lines = $isInvoice
                ? [['code' => '1103', 'debit' => $amount, 'credit' => 0], ['code' => '1104', 'debit' => 0, 'credit' => $amount]]
                : [['code' => '2101', 'debit' => $amount, 'credit' => 0], ['code' => '1103', 'debit' => 0, 'credit' => $amount]];

            $journal = JournalPoster::post($companyId, $data['date'], 'payment', $payment->id, $desc, $lines);

            // Catat juga sebagai mutasi bank agar muncul di buku bank, tertaut ke jurnal.
            $bankTx = BankTransaction::create([
                'company_id' => $companyId,
                'bank_account_id' => $account->id,
                'date' => $data['date'],
                'direction' => $direction,
                'amount' => $amount,
                'balance_after' => $account->current_balance,
                'description' => $desc,
                'reference' => $data['reference'] ?? $docNo,
                'journal_id' => $journal->id,
            ]);

            $payment->update(['journal_id' => $journal->id, 'bank_transaction_id' => $bankTx->id]);

            // Update paid_amount + status dokumen.
            $doc->paid_amount = (float) $doc->paid_amount + $amount;
            $doc->status = ((float) $doc->total - (float) $doc->paid_amount) < 0.01 ? 'paid' : 'partial';
            $doc->save();

            return $payment;
        });

        return response()->json($payment->load('bankAccount:id,bank_name,account_number'), 201);
    }

    // Batalkan pembayaran: kembalikan saldo bank, hapus jurnal & mutasi bank, pulihkan status dokumen.
    public function destroy(Payment $payment)
    {
        if (! \App\Models\AccountingPeriod::isOpenForDate($payment->company_id, (string) $payment->date->format('Y-m-d'))) {
            return response()->json(['message' => 'Tidak bisa menghapus: periode pembayaran ini sudah ditutup.'], 422);
        }

        DB::transaction(function () use ($payment) {
            $isInvoice = $payment->payable_type === 'invoice';
            $amount = (float) $payment->amount;

            // Kembalikan saldo akun bank (lawan dari saat pembuatan).
            $account = BankAccount::find($payment->bank_account_id);
            if ($account) {
                $account->current_balance += $isInvoice ? -$amount : $amount;
                $account->save();
            }

            // Hapus mutasi bank terkait.
            if ($payment->bank_transaction_id) {
                BankTransaction::withoutGlobalScopes()->where('id', $payment->bank_transaction_id)->delete();
            }

            // Hapus jurnal terkait pembayaran.
            Journal::withoutGlobalScopes()
                ->where('company_id', $payment->company_id)
                ->where('source_type', 'payment')->where('source_id', $payment->id)->delete();

            // Pulihkan paid_amount + status dokumen.
            $doc = $isInvoice
                ? Invoice::withoutGlobalScopes()->find($payment->payable_id)
                : PurchaseOrder::withoutGlobalScopes()->find($payment->payable_id);
            if ($doc) {
                $doc->paid_amount = max(0, (float) $doc->paid_amount - $amount);
                if ((float) $doc->paid_amount < 0.01) {
                    $doc->status = $isInvoice ? 'sent' : 'approved';
                } else {
                    $doc->status = 'partial';
                }
                $doc->save();
            }

            $payment->delete();
        });

        return response()->json(['message' => 'Pembayaran dibatalkan.']);
    }
}
