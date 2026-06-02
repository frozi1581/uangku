<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use BelongsToCompany;

    protected $guarded = [];
    protected $casts = ['is_active' => 'boolean'];

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
