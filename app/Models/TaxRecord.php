<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class TaxRecord extends Model
{
    use BelongsToCompany;

    protected $guarded = [];
    protected $casts = [
        'dpp' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'reported_at' => 'date',
    ];
}
