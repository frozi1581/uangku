<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payrolls', function (Blueprint $t) {
            $t->id();
            $t->foreignId('employee_id')->constrained('employees')->restrictOnDelete();
            $t->string('period', 7);
            $t->decimal('base_salary', 18, 2)->default(0);
            $t->decimal('allowances', 18, 2)->default(0);
            $t->decimal('bpjs_health', 18, 2)->default(0);
            $t->decimal('bpjs_employment', 18, 2)->default(0);
            $t->decimal('pph21', 18, 2)->default(0);
            $t->decimal('other_deductions', 18, 2)->default(0);
            $t->decimal('net_pay', 18, 2)->default(0);
            $t->enum('status', ['draft','ready','paid'])->default('draft');
            $t->date('paid_date')->nullable();
            $t->foreignId('journal_id')->nullable()->constrained('journals')->nullOnDelete();
            $t->timestamps();
            $t->unique(['employee_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
