<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    // Ganti unique global menjadi unique per-company (multi-tenant).
    private array $map = [
        'chart_of_accounts' => ['chart_of_accounts_code_unique', 'code'],
        'customers' => ['customers_code_unique', 'code'],
        'vendors' => ['vendors_code_unique', 'code'],
        'employees' => ['employees_employee_no_unique', 'employee_no'],
        'invoices' => ['invoices_invoice_no_unique', 'invoice_no'],
        'purchase_orders' => ['purchase_orders_po_no_unique', 'po_no'],
        'journals' => ['journals_journal_no_unique', 'journal_no'],
    ];

    public function up(): void
    {
        foreach ($this->map as $table => [$index, $col]) {
            // drop unique global (abaikan jika sudah tak ada)
            try { DB::statement("ALTER TABLE `{$table}` DROP INDEX `{$index}`"); } catch (\Throwable $e) {}
            // buat unique composite (company_id, col)
            try {
                Schema::table($table, function (Blueprint $t) use ($col) {
                    $t->unique(['company_id', $col]);
                });
            } catch (\Throwable $e) {}
        }
    }

    public function down(): void
    {
        foreach ($this->map as $table => [$index, $col]) {
            try {
                Schema::table($table, function (Blueprint $t) use ($col) {
                    $t->dropUnique(['company_id', $col]);
                });
            } catch (\Throwable $e) {}
            try {
                Schema::table($table, function (Blueprint $t) use ($col) {
                    $t->unique($col);
                });
            } catch (\Throwable $e) {}
        }
    }
};
