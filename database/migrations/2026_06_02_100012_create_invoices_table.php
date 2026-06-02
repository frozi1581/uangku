<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $t) {
            $t->id();
            $t->string('invoice_no', 40)->unique();
            $t->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $t->date('date');
            $t->date('due_date')->nullable();
            $t->decimal('subtotal', 18, 2)->default(0);
            $t->decimal('tax_amount', 18, 2)->default(0);
            $t->decimal('total', 18, 2)->default(0);
            $t->decimal('paid_amount', 18, 2)->default(0);
            $t->enum('status', ['draft','sent','paid','partial','overdue','void'])->default('draft');
            $t->text('notes')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
