<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountingPeriod;
use Illuminate\Http\Request;

class PeriodController extends Controller
{
    // Info periode open + status sebuah periode (query ?period=YYYY-MM).
    public function current(Request $request)
    {
        $companyId = $request->user()->company_id;
        if (! $companyId) {
            return response()->json(['message' => 'Akun tidak terhubung ke perusahaan.'], 422);
        }
        $open = AccountingPeriod::currentFor($companyId)->period;
        $check = $request->query('period');

        return response()->json([
            'open_period' => $open,
            'checked_period' => $check,
            'checked_status' => $check ? AccountingPeriod::statusFor($companyId, $check) : null,
        ]);
    }

    // Tutup periode berjalan & buka bulan berikutnya (maju 1 bulan).
    public function advance(Request $request)
    {
        $companyId = $request->user()->company_id;
        if (! $companyId) {
            return response()->json(['message' => 'Akun tidak terhubung ke perusahaan.'], 422);
        }
        $period = AccountingPeriod::currentFor($companyId);
        $next = \Carbon\Carbon::createFromFormat('Y-m', $period->period)->addMonth()->format('Y-m');
        $period->update(['period' => $next, 'opened_at' => now()]);

        return response()->json([
            'message' => "Periode ditutup. Periode berjalan sekarang {$next}.",
            'open_period' => $next,
        ]);
    }

    // Set periode open ke bulan tertentu (mis. mundur jika salah tutup). Body: period=YYYY-MM
    public function setOpen(Request $request)
    {
        $companyId = $request->user()->company_id;
        if (! $companyId) {
            return response()->json(['message' => 'Akun tidak terhubung ke perusahaan.'], 422);
        }
        $data = $request->validate(['period' => ['required', 'regex:/^\d{4}-\d{2}$/']]);
        $period = AccountingPeriod::currentFor($companyId);
        $period->update(['period' => $data['period'], 'opened_at' => now()]);

        return response()->json([
            'message' => "Periode berjalan diset ke {$data['period']}.",
            'open_period' => $data['period'],
        ]);
    }
}
