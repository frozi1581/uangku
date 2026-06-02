<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payroll extends Model
{
    use BelongsToCompany;

    protected $guarded = [];
    protected $casts = [
        'base_salary' => 'decimal:2',
        'allowances' => 'decimal:2',
        'bpjs_health' => 'decimal:2',
        'bpjs_employment' => 'decimal:2',
        'pph21' => 'decimal:2',
        'other_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'paid_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }
}
