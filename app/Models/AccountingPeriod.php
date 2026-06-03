<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class AccountingPeriod extends Model
{
    use BelongsToCompany;

    protected $guarded = [];
    protected $casts = ['opened_at' => 'datetime'];

    // Kolom `period` menyimpan BATAS BAWAH periode terbuka (open_from), format YYYY-MM.
    // Rentang terbuka = [open_from .. bulan berjalan]. Semua bulan di rentang ini boleh CRUD.

    // Ambil baris periode untuk company; default open_from = bulan berjalan.
    public static function currentFor(int $companyId): self
    {
        return static::withoutGlobalScopes()->firstOrCreate(
            ['company_id' => $companyId],
            ['period' => now()->format('Y-m'), 'opened_at' => now()]
        );
    }

    // Batas bawah periode terbuka (YYYY-MM).
    public static function openFrom(int $companyId): string
    {
        return static::currentFor($companyId)->period;
    }

    // Batas atas = bulan berjalan (YYYY-MM). Jika open_from > bulan berjalan (jarang), pakai open_from.
    public static function openTo(int $companyId): string
    {
        $now = now()->format('Y-m');
        $from = static::openFrom($companyId);
        return $from > $now ? $from : $now;
    }

    // Apakah tanggal/bulan berada dalam rentang terbuka [open_from .. bulan berjalan]?
    public static function isOpenForDate(int $companyId, string $date): bool
    {
        $month = substr($date, 0, 7); // YYYY-MM
        $from = static::openFrom($companyId);
        $to = static::openTo($companyId);
        return $month >= $from && $month <= $to;
    }

    // Status sebuah periode: 'open' | 'closed' | 'future'
    public static function statusFor(int $companyId, string $period): string
    {
        $from = static::openFrom($companyId);
        $to = static::openTo($companyId);
        if ($period >= $from && $period <= $to) return 'open';
        return $period < $from ? 'closed' : 'future';
    }
}
