<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $t) {
            $t->id();
            $t->string('employee_no', 30)->unique();
            $t->string('name');
            $t->string('position')->nullable();
            $t->string('department')->nullable();
            $t->string('npwp', 30)->nullable();
            $t->string('nik_ktp', 30)->nullable();
            $t->enum('ptkp_status', ['TK/0','TK/1','TK/2','TK/3','K/0','K/1','K/2','K/3'])->default('TK/0');
            $t->decimal('base_salary', 18, 2)->default(0);
            $t->string('bank_name')->nullable();
            $t->string('bank_account', 50)->nullable();
            $t->date('joined_at')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
