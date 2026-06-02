<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\TransactionUsage;
use App\Services\JournalPoster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BankTransactionController extends Controller
{
    public function index(Request $request)
    {
        $q = BankTransaction::with('bankAccount:id,bank_name,account_number')->latest('date');
        if ($request->filled('bank_account_id')) $q->where('bank_account_id', $request->bank_account_id);
        if ($request->filled('direction')) $q->where('direction', $request->direction);

        return response()->json($q->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'bank_account_id' => ['required', 'exists:bank_accounts,id'],
            'date' => ['required', 'date'],
            'direction' => ['required', 'in:in,out'],
            'amount' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'reference' => ['nullable', 'string'],
        ]);

        $companyId = $request->user()->company_id;
        if (! $companyId) {
            return response()->json(['message' => 'Akun ini tidak terhubung ke perusahaan (super admin tidak dapat membuat transaksi).'], 422);
        }

        $tx = DB::transaction(function () use ($data, $companyId) {
            $account = BankAccount::findOrFail($data['bank_account_id']);
            $delta = $data['direction'] === 'in' ? $data['amount'] : -$data['amount'];
            $account->current_balance += $delta;
            $account->save();

            $tx = BankTransaction::create([
                'company_id' => $companyId,
                'bank_account_id' => $account->id,
                'date' => $data['date'],
                'direction' => $data['direction'],
                'amount' => $data['amount'],
                'balance_after' => $account->current_balance,
                'description' => $data['description'] ?? null,
                'reference' => $data['reference'] ?? null,
            ]);

            // Jurnal kas: uang masuk -> D Bank (1103) ; K (sementara) Pendapatan Lain (4102)
            //             uang keluar -> D Beban Operasional (5103) ; K Bank (1103)
            $lines = $data['direction'] === 'in'
                ? [['code' => '1103', 'debit' => $data['amount'], 'credit' => 0], ['code' => '4102', 'debit' => 0, 'credit' => $data['amount']]]
                : [['code' => '5103', 'debit' => $data['amount'], 'credit' => 0], ['code' => '1103', 'debit' => 0, 'credit' => $data['amount']]];

            $journal = JournalPoster::post($companyId, $data['date'], 'bank_transaction', $tx->id, $data['description'] ?? 'Transaksi bank', $lines);
            $tx->update(['journal_id' => $journal->id]);

            TransactionUsage::recordUsage($companyId, 'bank');

            return $tx;
        });

        return response()->json($tx, 201);
    }

    public function destroy(BankTransaction $bankTransaction)
    {
        $bankTransaction->delete();
        return response()->json(['message' => 'Transaksi bank dihapus.']);
    }
}
