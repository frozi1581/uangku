<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'code' => 'free',
                'name' => 'Free',
                'price' => 0,
                'max_transactions' => 100,   // 100 transaksi / bulan
                'max_reports' => 5,
                'is_customizable' => false,
                'description' => 'Gratis, terbatas 100 transaksi per bulan.',
                'features' => ['dashboard', 'invoice_basic', 'laporan_basic'],
            ],
            [
                'code' => 'premium',
                'name' => 'Premium',
                'price' => 199000,           // default, bisa di-set admin per company
                'max_transactions' => 2000,  // default, bisa di-set admin
                'max_reports' => 100,
                'is_customizable' => true,
                'description' => 'Harga & batas transaksi dapat diatur oleh admin.',
                'features' => ['dashboard', 'invoice', 'purchase', 'payroll', 'pajak', 'laporan'],
            ],
            [
                'code' => 'ultimate',
                'name' => 'Ultimate',
                'price' => 499000,
                'max_transactions' => null,  // unlimited
                'max_reports' => null,       // unlimited
                'is_customizable' => false,
                'description' => 'Transaksi & laporan tanpa batas.',
                'features' => ['dashboard', 'invoice', 'purchase', 'payroll', 'pajak', 'laporan', 'ai_forecast', 'api'],
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['code' => $plan['code']], $plan);
        }
    }
}
