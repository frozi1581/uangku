<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // User yang daftar via Google tidak punya password.
        DB::statement('ALTER TABLE `users` MODIFY `password` VARCHAR(255) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE `users` MODIFY `password` VARCHAR(255) NOT NULL');
    }
};
