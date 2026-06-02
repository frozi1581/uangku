<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // Saldo per akun (debit - credit) s/d tanggal tertentu, untuk company aktif.
    protected function balances(int $companyId, ?string $asOf = null, ?string $from = null)
    {
        $q = JournalEntry::withoutGlobalScopes()
            ->join('journals', 'journals.id', '=', 'journal_entries.journal_id')
            ->where('journal_entries.company_id', $companyId)
            ->where('journals.status', 'posted');
        if ($asOf) $q->whereDate('journals.date', '<=', $asOf);
        if ($from) $q->whereDate('journals.date', '>=', $from);

        return $q->select('journal_entries.coa_id',
                DB::raw('SUM(journal_entries.debit) as d'),
                DB::raw('SUM(journal_entries.credit) as c'))
            ->groupBy('journal_entries.coa_id')
            ->get()
            ->keyBy('coa_id');
    }

    public function balanceSheet(Request $request)
    {
        $companyId = $request->user()->company_id;
        $asOf = $request->query('date', now()->toDateString());
        $bal = $this->balances($companyId, $asOf);

        $accounts = ChartOfAccount::withoutGlobalScopes()
            ->where('company_id', $companyId)->get();

        $groups = ['asset' => [], 'liability' => [], 'equity' => []];
        $totals = ['asset' => 0, 'liability' => 0, 'equity' => 0];
        $currentEarnings = 0; // laba berjalan (revenue - expense) -> masuk ekuitas

        foreach ($accounts as $a) {
            $row = $bal->get($a->id);
            if (! $row) continue;
            // Aset & beban = debit normal (d - c); Liabilitas/Ekuitas/Pendapatan = credit normal (c - d)
            $amount = in_array($a->type, ['asset', 'expense'])
                ? ($row->d - $row->c)
                : ($row->c - $row->d);

            // Pendapatan & beban tidak tampil langsung di neraca; akumulasi jadi laba berjalan.
            if ($a->type === 'revenue') { $currentEarnings += $amount; continue; }
            if ($a->type === 'expense') { $currentEarnings -= $amount; continue; }

            if (! isset($groups[$a->type])) continue;
            if (abs($amount) < 0.01) continue;
            $groups[$a->type][] = ['code' => $a->code, 'name' => $a->name, 'amount' => round($amount, 2)];
            $totals[$a->type] += $amount;
        }

        // Tambahkan laba berjalan ke ekuitas agar neraca seimbang.
        if (abs($currentEarnings) >= 0.01) {
            $groups['equity'][] = ['code' => '3199', 'name' => 'Laba Berjalan', 'amount' => round($currentEarnings, 2)];
            $totals['equity'] += $currentEarnings;
        }

        return response()->json([
            'as_of' => $asOf,
            'assets' => ['total' => round($totals['asset'], 2), 'items' => $groups['asset']],
            'liabilities' => ['total' => round($totals['liability'], 2), 'items' => $groups['liability']],
            'equity' => ['total' => round($totals['equity'], 2), 'items' => $groups['equity']],
            'is_balanced' => abs($totals['asset'] - ($totals['liability'] + $totals['equity'])) < 0.01,
        ]);
    }

    public function cashFlow(Request $request)
    {
        $companyId = $request->user()->company_id;
        $from = $request->query('from', now()->startOfYear()->toDateString());
        $to = $request->query('to', now()->toDateString());

        // Kas & bank = akun 1101, 1102, 1103. Hitung mutasi (d - c) dalam periode.
        $cashCodes = ['1101', '1102', '1103'];
        $cashIds = ChartOfAccount::withoutGlobalScopes()
            ->where('company_id', $companyId)->whereIn('code', $cashCodes)->pluck('id');

        $opening = JournalEntry::withoutGlobalScopes()
            ->join('journals', 'journals.id', '=', 'journal_entries.journal_id')
            ->where('journal_entries.company_id', $companyId)
            ->whereIn('journal_entries.coa_id', $cashIds)
            ->whereDate('journals.date', '<', $from)
            ->sum(DB::raw('journal_entries.debit - journal_entries.credit'));

        $periodMutation = JournalEntry::withoutGlobalScopes()
            ->join('journals', 'journals.id', '=', 'journal_entries.journal_id')
            ->where('journal_entries.company_id', $companyId)
            ->whereIn('journal_entries.coa_id', $cashIds)
            ->whereBetween('journals.date', [$from, $to])
            ->sum(DB::raw('journal_entries.debit - journal_entries.credit'));

        return response()->json([
            'period' => ['from' => $from, 'to' => $to],
            'opening_balance' => round((float) $opening, 2),
            'net_change' => round((float) $periodMutation, 2),
            'closing_balance' => round((float) $opening + (float) $periodMutation, 2),
            'note' => 'Mutasi kas & bank (akun 1101/1102/1103) dalam periode.',
        ]);
    }
}
