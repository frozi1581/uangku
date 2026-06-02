<?php

namespace App\Models;

use App\Observers\CompanyObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy(CompanyObserver::class)]
class Company extends Model
{
    protected $guarded = [];

    protected $casts = [
        'plan_id' => 'integer',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription()
    {
        return $this->subscriptions()
            ->where('status', 'active')
            ->latest('starts_at')
            ->first();
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function usages(): HasMany
    {
        return $this->hasMany(TransactionUsage::class);
    }

    public function currentUsage(): ?TransactionUsage
    {
        return $this->usages()->where('period', now()->format('Y-m'))->first();
    }

    // Cek apakah company masih boleh menambah transaksi bulan ini
    public function canAddTransaction(): bool
    {
        $sub = $this->activeSubscription();
        $limit = $sub?->max_transactions; // null = unlimited
        if (is_null($limit)) {
            return true;
        }
        $used = $this->currentUsage()?->total_count ?? 0;
        return $used < $limit;
    }
}
