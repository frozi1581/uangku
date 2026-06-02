<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_transactions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();
            $t->date('date');
            $t->enum('direction', ['in', 'out']);
            $t->decimal('amount', 18, 2);
            $t->decimal('balance_after', 18, 2)->nullable();
            $t->string('description')->nullable();
            $t->string('reference')->nullable();
            $t->boolean('is_reconciled')->default(false);
            $t->foreignId('journal_id')->nullable()->constrained('journals')->nullOnDelete();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_transactions');
    }
};
