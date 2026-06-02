<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use BelongsToCompany;

    protected $guarded = [];
    protected $casts = [
        'base_salary' => 'decimal:2',
        'joined_at' => 'date',
        'is_active' => 'boolean',
    ];

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }
}
