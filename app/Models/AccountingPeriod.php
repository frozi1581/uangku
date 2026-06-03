<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class AccountingPeriod extends Model
{
    use BelongsToCompany;

    protected $guarded = [];
    protected $casts = ['opened_at' => 'datetime'];

    // Ambil periode open untuk company; jika belum ada, buat default = bulan berjalan.
    public static function currentFor(int $companyId): self
    {
        return static::withoutGlobalScopes()->firstOrCreate(
            ['company_id' => $companyId],
            ['period' => now()->format('Y-m'), 'opened_at' => now()]
        );
    }

    // Apakah suatu tanggal (Y-m-d / Y-m) berada di periode yang OPEN?
    // Aturan: hanya periode yang persis = bulan open yang boleh CRUD.
    public static function isOpenForDate(int $companyId, string $date): bool
    {
        $month = substr($date, 0, 7); // YYYY-MM
        $open = static::currentFor($companyId)->period;
        return $month === $open;
    }

    // Status sebuah periode relatif terhadap periode open: 'open' | 'closed' | 'future'
    public static function statusFor(int $companyId, string $period): string
    {
        $open = static::currentFor($companyId)->period;
        if ($period === $open) return 'open';
        return $period < $open ? 'closed' : 'future';
    }
}
