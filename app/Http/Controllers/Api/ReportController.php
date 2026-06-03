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

    // Laporan piutang (AR aging): invoice yang belum lunas + umur jatuh tempo.
    public function receivables(Request $request)
    {
        $asOf = $request->query('date', now()->toDateString());
        $rows = \App\Models\Invoice::with('customer:id,name')
            ->whereIn('status', ['sent', 'partial', 'overdue', 'draft'])
            ->whereRaw('total - paid_amount > 0.009')
            ->orderBy('due_date')->orderBy('date')->get();

        return response()->json($this->agingPayload($rows, $asOf, true));
    }

    // Laporan hutang (AP aging): PO yang belum lunas + umur jatuh tempo.
    public function payables(Request $request)
    {
        $asOf = $request->query('date', now()->toDateString());
        $rows = \App\Models\PurchaseOrder::with('vendor:id,name')
            ->whereIn('status', ['approved', 'received', 'partial'])
            ->whereRaw('total - paid_amount > 0.009')
            ->orderBy('expected_date')->orderBy('date')->get();

        return response()->json($this->agingPayload($rows, $asOf, false));
    }

    // Susun payload aging seragam untuk invoice/PO.
    protected function agingPayload($rows, string $asOf, bool $isInvoice): array
    {
        $today = \Carbon\Carbon::parse($asOf);
        $buckets = ['current' => 0, 'd1_30' => 0, 'd31_60' => 0, 'd61_90' => 0, 'over_90' => 0];
        $items = [];
        $totalOutstanding = 0;

        foreach ($rows as $r) {
            $outstanding = round((float) $r->total - (float) $r->paid_amount, 2);
            if ($outstanding <= 0) continue;
            $due = $isInvoice ? $r->due_date : $r->expected_date;
            $daysOverdue = $due ? $today->diffInDays(\Carbon\Carbon::parse($due), false) * -1 : 0;
            // daysOverdue > 0 berarti sudah lewat jatuh tempo.
            if ($daysOverdue <= 0) $buckets['current'] += $outstanding;
            elseif ($daysOverdue <= 30) $buckets['d1_30'] += $outstanding;
            elseif ($daysOverdue <= 60) $buckets['d31_60'] += $outstanding;
            elseif ($daysOverdue <= 90) $buckets['d61_90'] += $outstanding;
            else $buckets['over_90'] += $outstanding;

            $totalOutstanding += $outstanding;
            $items[] = [
                'id' => $r->id,
                'no' => $isInvoice ? $r->invoice_no : $r->po_no,
                'party' => $isInvoice ? ($r->customer?->name) : ($r->vendor?->name),
                'date' => (string) $r->date?->format('Y-m-d'),
                'due_date' => $due ? (string) $due->format('Y-m-d') : null,
                'total' => round((float) $r->total, 2),
                'paid_amount' => round((float) $r->paid_amount, 2),
                'outstanding' => $outstanding,
                'days_overdue' => $daysOverdue > 0 ? $daysOverdue : 0,
                'status' => $r->status,
            ];
        }

        return [
            'as_of' => $asOf,
            'total_outstanding' => round($totalOutstanding, 2),
            'aging' => array_map(fn ($v) => round($v, 2), $buckets),
            'items' => $items,
        ];
    }
}
