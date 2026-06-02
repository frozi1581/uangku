<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $guarded = [];

    protected $casts = [
        'price' => 'decimal:2',
        'max_transactions' => 'integer',
        'max_reports' => 'integer',
        'is_customizable' => 'boolean',
        'is_active' => 'boolean',
        'features' => 'array',
    ];

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function isUnlimited(): bool
    {
        return is_null($this->max_transactions);
    }
}
