<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $t) {
            $t->id();
            $t->string('po_no', 40)->unique();
            $t->foreignId('vendor_id')->constrained('vendors')->restrictOnDelete();
            $t->date('date');
            $t->date('expected_date')->nullable();
            $t->decimal('subtotal', 18, 2)->default(0);
            $t->decimal('tax_amount', 18, 2)->default(0);
            $t->decimal('total', 18, 2)->default(0);
            $t->decimal('paid_amount', 18, 2)->default(0);
            $t->enum('status', ['draft','pending_approval','approved','rejected','received','paid','void'])->default('draft');
            $t->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('approved_at')->nullable();
            $t->text('notes')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
