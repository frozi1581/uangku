<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_of_accounts', function (Blueprint $t) {
            $t->id();
            $t->string('code', 20)->unique();
            $t->string('name');
            $t->enum('type', ['asset', 'liability', 'equity', 'revenue', 'expense']);
            $t->foreignId('parent_id')->nullable()->constrained('chart_of_accounts')->nullOnDelete();
            $t->boolean('is_active')->default(true);
            $t->text('description')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chart_of_accounts');
    }
};
