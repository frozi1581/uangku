<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $guarded = [];

    protected $casts = [
        'price' => 'decimal:2',
        'max_transactions' => 'integer',
        'max_reports' => 'integer',
        'starts_at' => 'date',
        'ends_at' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active'
            && (is_null($this->ends_at) || $this->ends_at->isFuture());
    }
}
