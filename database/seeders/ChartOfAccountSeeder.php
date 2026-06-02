<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class ChartOfAccountSeeder extends Seeder
{
    // Struktur akun standar (PSAK) untuk perusahaan Indonesia.
    // Format: [code, name, type, parent_code|null]
    public static array $accounts = [
        // ASET
        ['1000', 'ASET', 'asset', null],
        ['1100', 'Aset Lancar', 'asset', '1000'],
        ['1101', 'Kas', 'asset', '1100'],
        ['1102', 'Kas Kecil', 'asset', '1100'],
        ['1103', 'Bank', 'asset', '1100'],
        ['1104', 'Piutang Usaha', 'asset', '1100'],
        ['1105', 'Persediaan', 'asset', '1100'],
        ['1106', 'PPN Masukan', 'asset', '1100'],
        ['1200', 'Aset Tetap', 'asset', '1000'],
        ['1201', 'Peralatan', 'asset', '1200'],
        ['1202', 'Kendaraan', 'asset', '1200'],
        ['1203', 'Akumulasi Penyusutan', 'asset', '1200'],
        // LIABILITAS
        ['2000', 'LIABILITAS', 'liability', null],
        ['2100', 'Liabilitas Jangka Pendek', 'liability', '2000'],
        ['2101', 'Hutang Usaha', 'liability', '2100'],
        ['2102', 'PPN Keluaran', 'liability', '2100'],
        ['2103', 'Hutang PPh 21', 'liability', '2100'],
        ['2104', 'Hutang Gaji', 'liability', '2100'],
        ['2105', 'Hutang BPJS', 'liability', '2100'],
        // EKUITAS
        ['3000', 'EKUITAS', 'equity', null],
        ['3101', 'Modal Disetor', 'equity', '3000'],
        ['3102', 'Laba Ditahan', 'equity', '3000'],
        // PENDAPATAN
        ['4000', 'PENDAPATAN', 'revenue', null],
        ['4101', 'Pendapatan Penjualan', 'revenue', '4000'],
        ['4102', 'Pendapatan Lain-lain', 'revenue', '4000'],
        // BEBAN
        ['5000', 'BEBAN', 'expense', null],
        ['5101', 'Beban Pokok Penjualan', 'expense', '5000'],
        ['5102', 'Beban Gaji', 'expense', '5000'],
        ['5103', 'Beban Operasional', 'expense', '5000'],
        ['5104', 'Beban Penyusutan', 'expense', '5000'],
        ['5105', 'Beban Pajak', 'expense', '5000'],
    ];

    // Seed CoA default untuk satu company.
    public static function seedForCompany(int $companyId): void
    {
        $idByCode = [];
        foreach (self::$accounts as [$code, $name, $type, $parentCode]) {
            $coa = ChartOfAccount::withoutGlobalScopes()->updateOrCreate(
                ['company_id' => $companyId, 'code' => $code],
                [
                    'name' => $name,
                    'type' => $type,
                    'parent_id' => $parentCode ? ($idByCode[$parentCode] ?? null) : null,
                    'is_active' => true,
                ]
            );
            $idByCode[$code] = $coa->id;
        }
    }

    public function run(): void
    {
        // Tanpa argumen: tidak melakukan apa-apa (CoA bersifat per-company).
        // Panggil ChartOfAccountSeeder::seedForCompany($companyId) saat company dibuat.
    }
}
