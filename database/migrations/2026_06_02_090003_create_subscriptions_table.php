<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $t->foreignId('plan_id')->constrained('plans')->restrictOnDelete();
            // snapshot harga & limit saat berlangganan (premium bisa override dari admin)
            $t->decimal('price', 14, 2)->default(0);
            $t->integer('max_transactions')->nullable(); // null = unlimited
            $t->integer('max_reports')->nullable();      // null = unlimited
            $t->date('starts_at');
            $t->date('ends_at')->nullable();
            $t->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $t->text('notes')->nullable();
            $t->timestamps();
            $t->index(['company_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
