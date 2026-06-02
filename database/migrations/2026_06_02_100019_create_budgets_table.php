<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $t) {
            $t->id();
            $t->year('fiscal_year');
            $t->string('department')->nullable();
            $t->foreignId('coa_id')->nullable()->constrained('chart_of_accounts')->nullOnDelete();
            $t->string('period', 7)->nullable();
            $t->decimal('planned_amount', 18, 2)->default(0);
            $t->decimal('actual_amount', 18, 2)->default(0);
            $t->decimal('alert_threshold', 5, 2)->default(90);
            $t->text('notes')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
