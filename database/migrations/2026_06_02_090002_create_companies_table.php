<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $t) {
            $t->id();
            $t->string('code', 30)->unique();        // company code
            $t->string('name');
            $t->string('npwp', 30)->nullable();
            $t->string('email')->nullable();
            $t->string('phone', 30)->nullable();
            $t->text('address')->nullable();
            $t->string('logo_path')->nullable();
            $t->string('timezone', 50)->default('Asia/Jakarta');
            $t->string('currency', 3)->default('IDR');
            $t->foreignId('plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $t->enum('status', ['active', 'suspended', 'trial'])->default('trial');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
