<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $t) {
            $t->id();
            $t->string('code', 30)->unique();        // free, premium, ultimate
            $t->string('name');
            $t->decimal('price', 14, 2)->default(0); // harga bulanan, bisa di-set admin
            $t->string('currency', 3)->default('IDR');
            $t->integer('max_transactions')->nullable();   // null = unlimited
            $t->integer('max_reports')->nullable();        // null = unlimited
            $t->boolean('is_customizable')->default(false);// premium = true
            $t->boolean('is_active')->default(true);
            $t->text('description')->nullable();
            $t->json('features')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
