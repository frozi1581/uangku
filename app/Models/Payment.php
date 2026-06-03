<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use BelongsToCompany;

    protected $guarded = [];
    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    // Dokumen yang dibayar (invoice atau purchase order), di-resolve manual.
    public function payable()
    {
        return $this->payable_type === 'invoice'
            ? Invoice::find($this->payable_id)
            : PurchaseOrder::find($this->payable_id);
    }
}
