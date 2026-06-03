<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_periods', function (Blueprint $t) {
            $t->id();
            $t->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $t->string('period', 7); // YYYY-MM = periode yang sedang OPEN
            $t->timestamp('opened_at')->nullable();
            $t->timestamps();
            $t->unique('company_id'); // 1 baris per company = periode berjalan
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_periods');
    }
};
