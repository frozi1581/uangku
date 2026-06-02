<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_accounts', function (Blueprint $t) {
            $t->id();
            $t->string('bank_name');
            $t->string('account_number', 50);
            $t->string('account_holder');
            $t->string('currency', 3)->default('IDR');
            $t->enum('type', ['bank', 'cash_large', 'cash_small'])->default('bank');
            $t->decimal('opening_balance', 18, 2)->default(0);
            $t->decimal('current_balance', 18, 2)->default(0);
            $t->foreignId('coa_id')->nullable()->constrained('chart_of_accounts')->nullOnDelete();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};
