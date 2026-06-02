<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class TransactionUsage extends Model
{
    use BelongsToCompany;

    protected $guarded = [];

    protected $casts = [
        'invoice_count' => 'integer',
        'po_count' => 'integer',
        'bank_tx_count' => 'integer',
        'total_count' => 'integer',
        'report_count' => 'integer',
    ];

    // Ambil / buat baris usage untuk company + periode berjalan, lalu naikkan counter
    public static function recordUsage(int $companyId, string $type): self
    {
        $period = now()->format('Y-m');
        $usage = static::withoutGlobalScopes()->firstOrCreate(
            ['company_id' => $companyId, 'period' => $period]
        );

        $map = ['invoice' => 'invoice_count', 'po' => 'po_count', 'bank' => 'bank_tx_count'];
        if (isset($map[$type])) {
            $usage->{$map[$type]}++;
        }
        $usage->total_count = $usage->invoice_count + $usage->po_count + $usage->bank_tx_count;
        $usage->save();

        return $usage;
    }
}
