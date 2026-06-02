<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceTransactionQuota
{
    /**
     * Blokir pembuatan transaksi baru (invoice / PO / bank) bila kuota
     * bulan berjalan sudah tercapai. Hanya berlaku untuk request yang
     * membuat data baru (POST). Super-admin dan plan unlimited dilewati.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Lewati: tamu, super-admin, atau user tanpa company.
        if (! $user || $user->is_super_admin || ! $user->company_id) {
            return $next($request);
        }

        $company = $user->company;
        if (! $company) {
            return $next($request);
        }

        if (! $company->canAddTransaction()) {
            $sub = $company->activeSubscription();
            $limit = $sub?->max_transactions;
            $used = $company->currentUsage()?->total_count ?? 0;

            $message = "Kuota transaksi bulan ini sudah tercapai ({$used}/{$limit}). "
                . "Tingkatkan paket untuk menambah transaksi.";

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                    'quota' => ['limit' => $limit, 'used' => $used],
                ], 429);
            }

            return redirect()->back()->withErrors(['quota' => $message]);
        }

        return $next($request);
    }
}
