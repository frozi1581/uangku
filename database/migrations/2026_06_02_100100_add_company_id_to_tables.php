<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'chart_of_accounts', 'customers', 'vendors', 'bank_accounts', 'employees',
        'journals', 'journal_entries', 'invoices', 'invoice_items',
        'purchase_orders', 'purchase_order_items', 'bank_transactions',
        'payrolls', 'tax_records', 'budgets',
    ];

    public function up(): void
    {
        // users: nullable (boleh ada super-admin platform tanpa company)
        Schema::table('users', function (Blueprint $t) {
            $t->foreignId('company_id')->nullable()->after('id')
                ->constrained('companies')->nullOnDelete();
            $t->boolean('is_super_admin')->default(false)->after('company_id');
        });

        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('company_id')->nullable()->after('id')
                    ->constrained('companies')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropForeign(['company_id']);
                $t->dropColumn('company_id');
            });
        }
        Schema::table('users', function (Blueprint $t) {
            $t->dropForeign(['company_id']);
            $t->dropColumn(['company_id', 'is_super_admin']);
        });
    }
};
