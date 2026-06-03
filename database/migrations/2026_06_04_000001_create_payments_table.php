<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $t->string('payment_no', 40);
            // Tipe dokumen yang dibayar: 'invoice' (penerimaan piutang) atau 'purchase_order' (pembayaran hutang)
            $t->enum('payable_type', ['invoice', 'purchase_order']);
            $t->unsignedBigInteger('payable_id');
            // Akun kas/bank tujuan/sumber dana
            $t->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();
            $t->date('date');
            $t->decimal('amount', 18, 2);
            $t->string('reference')->nullable();
            $t->text('notes')->nullable();
            // Jejak ke jurnal & transaksi bank yang dibuat otomatis
            $t->foreignId('journal_id')->nullable()->constrained('journals')->nullOnDelete();
            $t->foreignId('bank_transaction_id')->nullable()->constrained('bank_transactions')->nullOnDelete();
            $t->timestamps();

            $t->index(['company_id', 'payable_type', 'payable_id']);
            $t->unique(['company_id', 'payment_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
