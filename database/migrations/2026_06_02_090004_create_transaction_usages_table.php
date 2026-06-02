<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_usages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $t->string('period', 7); // YYYY-MM
            $t->integer('invoice_count')->default(0);
            $t->integer('po_count')->default(0);
            $t->integer('bank_tx_count')->default(0);
            $t->integer('total_count')->default(0); // invoice + po + bank
            $t->integer('report_count')->default(0);
            $t->timestamps();
            $t->unique(['company_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_usages');
    }
};
