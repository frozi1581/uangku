<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journals', function (Blueprint $t) {
            $t->id();
            $t->string('journal_no', 40)->unique();
            $t->date('date');
            $t->string('reference')->nullable();
            $t->string('source_type')->nullable();
            $t->unsignedBigInteger('source_id')->nullable();
            $t->text('description')->nullable();
            $t->decimal('total_debit', 18, 2)->default(0);
            $t->decimal('total_credit', 18, 2)->default(0);
            $t->enum('status', ['draft', 'posted', 'void'])->default('draft');
            $t->timestamps();
            $t->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journals');
    }
};
