<?php

namespace App\Observers;

use App\Models\Company;
use Database\Seeders\ChartOfAccountSeeder;

class CompanyObserver
{
    // Saat company baru dibuat, otomatis isi chart of accounts standar PSAK.
    public function created(Company $company): void
    {
        ChartOfAccountSeeder::seedForCompany($company->id);
    }
}
