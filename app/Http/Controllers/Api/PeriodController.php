<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountingPeriod;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PeriodController extends Controller
{
    // Info rentang periode terbuka + (opsional) status sebuah periode (?period=YYYY-MM).
    public function current(Request $request)
    {
        $companyId = $request->user()->company_id;
        if (! $companyId) {
            return response()->json(['message' => 'Akun tidak terhubung ke perusahaan.'], 422);
        }
        $from = AccountingPeriod::openFrom($companyId);
        $to = AccountingPeriod::openTo($companyId);
        $check = $request->query('period');

        return response()->json([
            'open_from' => $from,
            'open_to' => $to,
            'checked_period' => $check,
            'checked_status' => $check ? AccountingPeriod::statusFor($companyId, $check) : null,
        ]);
    }

    // Buka 1 bulan lebih awal (turunkan batas bawah). Tidak boleh lompat.
    public function openPrevious(Request $request)
    {
        $companyId = $request->user()->company_id;
        if (! $companyId) {
            return response()->json(['message' => 'Akun tidak terhubung ke perusahaan.'], 422);
        }
        $row = AccountingPeriod::currentFor($companyId);
        $prev = Carbon::createFromFormat('Y-m', $row->period)->subMonth()->format('Y-m');
        $row->update(['period' => $prev, 'opened_at' => now()]);

        return response()->json([
            'message' => "Periode {$prev} dibuka.",
            'open_from' => $prev,
            'open_to' => AccountingPeriod::openTo($companyId),
        ]);
    }

    // Tutup bulan terbawah (naikkan batas bawah). Tidak boleh melewati bulan berjalan.
    public function closeEarliest(Request $request)
    {
        $companyId = $request->user()->company_id;
        if (! $companyId) {
            return response()->json(['message' => 'Akun tidak terhubung ke perusahaan.'], 422);
        }
        $row = AccountingPeriod::currentFor($companyId);
        $now = now()->format('Y-m');

        if ($row->period >= $now) {
            return response()->json(['message' => 'Bulan berjalan tidak dapat ditutup. Minimal satu bulan harus tetap terbuka.'], 422);
        }
        $next = Carbon::createFromFormat('Y-m', $row->period)->addMonth()->format('Y-m');
        $closed = $row->period;
        $row->update(['period' => $next, 'opened_at' => now()]);

        return response()->json([
            'message' => "Periode {$closed} ditutup.",
            'open_from' => $next,
            'open_to' => AccountingPeriod::openTo($companyId),
        ]);
    }
}
