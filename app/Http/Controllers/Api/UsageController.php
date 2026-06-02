<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UsageController extends Controller
{
    public function current(Request $request)
    {
        $company = $request->user()->company;
        $usage = $company?->currentUsage();
        $sub = $company?->activeSubscription();

        return response()->json([
            'period' => now()->format('Y-m'),
            'transactions' => [
                'limit' => $sub?->max_transactions,
                'used' => $usage?->total_count ?? 0,
                'invoice' => $usage?->invoice_count ?? 0,
                'po' => $usage?->po_count ?? 0,
                'bank' => $usage?->bank_tx_count ?? 0,
            ],
            'reports' => [
                'limit' => $sub?->max_reports,
                'used' => $usage?->report_count ?? 0,
            ],
        ]);
    }
}
