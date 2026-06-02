<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Budget extends Model
{
    use BelongsToCompany;

    protected $guarded = [];
    protected $casts = [
        'fiscal_year' => 'integer',
        'planned_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
        'alert_threshold' => 'decimal:2',
    ];

    public function coa(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'coa_id');
    }

    public function deviationPercent(): float
    {
        if ((float) $this->planned_amount == 0.0) {
            return 0.0;
        }
        return round(((float) $this->actual_amount / (float) $this->planned_amount) * 100, 2);
    }

    public function isOverBudget(): bool
    {
        return (float) $this->actual_amount > (float) $this->planned_amount;
    }
}
