<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $t) {
            $t->id();
            $t->string('code', 30)->nullable()->unique();
            $t->string('name');
            $t->string('npwp', 30)->nullable();
            $t->string('email')->nullable();
            $t->string('phone', 30)->nullable();
            $t->text('address')->nullable();
            $t->string('contract_ref')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
