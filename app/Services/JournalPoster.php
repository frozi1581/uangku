<?php

namespace App\Services;

use App\Models\ChartOfAccount;
use App\Models\Journal;
use App\Models\JournalEntry;
use Illuminate\Support\Str;

class JournalPoster
{
    // Cari id akun berdasarkan kode untuk company tertentu.
    protected static function coaId(int $companyId, string $code): ?int
    {
        return ChartOfAccount::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('code', $code)
            ->value('id');
    }

    /**
     * Buat jurnal seimbang dari daftar baris [coa_code, debit, credit].
     * Mengembalikan Journal yang sudah tersimpan.
     */
    public static function post(int $companyId, string $date, string $sourceType, int $sourceId, string $desc, array $lines): Journal
    {
        $totalD = 0;
        $totalC = 0;
        foreach ($lines as $l) {
            $totalD += $l['debit'] ?? 0;
            $totalC += $l['credit'] ?? 0;
        }

        $journal = Journal::withoutGlobalScopes()->create([
            'company_id' => $companyId,
            'journal_no' => 'JV-' . now()->format('Ymd') . '-' . strtoupper(Str::random(5)),
            'date' => $date,
            'reference' => $sourceType . '#' . $sourceId,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'description' => $desc,
            'total_debit' => $totalD,
            'total_credit' => $totalC,
            'status' => 'posted',
        ]);

        foreach ($lines as $l) {
            $coaId = self::coaId($companyId, $l['code']);
            if (! $coaId) {
                continue; // lewati kalau akun tak ditemukan
            }
            JournalEntry::withoutGlobalScopes()->create([
                'company_id' => $companyId,
                'journal_id' => $journal->id,
                'coa_id' => $coaId,
                'debit' => $l['debit'] ?? 0,
                'credit' => $l['credit'] ?? 0,
                'memo' => $l['memo'] ?? null,
            ]);
        }

        return $journal;
    }
}
