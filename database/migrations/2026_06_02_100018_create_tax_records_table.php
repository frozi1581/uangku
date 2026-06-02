<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_records', function (Blueprint $t) {
            $t->id();
            $t->enum('tax_type', ['ppn_out','ppn_in','pph21','pph23','pph_final','pph_badan']);
            $t->string('period', 7);
            $t->string('faktur_no', 50)->nullable();
            $t->string('counterpart')->nullable();
            $t->string('counterpart_npwp', 30)->nullable();
            $t->decimal('dpp', 18, 2)->default(0);
            $t->decimal('tax_amount', 18, 2)->default(0);
            $t->enum('efaktur_status', ['none','pending','uploaded','error'])->default('none');
            $t->string('source_type')->nullable();
            $t->unsignedBigInteger('source_id')->nullable();
            $t->date('reported_at')->nullable();
            $t->timestamps();
            $t->index(['tax_type', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_records');
    }
};
