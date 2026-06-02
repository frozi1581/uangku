# Uangku — Catatan Implementasi Database & Multi-Tenant SaaS

> Dokumen ini merangkum semua yang sudah dikerjakan pada sesi implementasi database Uangku,
> beserta path, tools, dan langkah lanjutan. Dipakai sebagai referensi / instruction sesi berikutnya.
> Diperbarui: Juni 2026

---

## 1. Lingkungan & Akses

### Path Project
| Lokasi | Path |
|---|---|
| **Local (Mac)** | `/Users/fachrulrozi/PhpstormProjects/uangku.layanan-aplikasi.com` |
| **Server** | `/home/layr1858/public_html/uangku.layanan-aplikasi.com` |

> Catatan: folder lokal saat ini hanya berisi file yang dibuat di sesi ini (migrations, models,
> seeders, observer, middleware, bootstrap/app.php). Bukan clone penuh dari project server.

### Server
| | |
|---|---|
| **Hostname** | `ciliwung.iixcp.rumahweb.net` |
| **SSH (passwordless)** | `ssh layr1858@layanan-aplikasi.com -p 2223` |
| **User** | `layr1858` |
| **Stack** | Laravel 11.53.1 · PHP 8.3.31 · MariaDB 10.11.16 |

### Database (dari `.env` di root project server)
| Key | Value |
|---|---|
| DB_CONNECTION | mysql |
| DB_HOST | localhost |
| DB_PORT | 3306 |
| DB_DATABASE | `layr1858_lara767` |
| DB_USERNAME | `layr1858_lara767` |
| DB_PASSWORD | *(ada di file `.env` server — jangan commit / share)* |

---

## 2. Tools yang Digunakan

| Keperluan | Tool | Catatan |
|---|---|---|
| **Menulis file di lokal** | Desktop Commander `write_file` | Tulis ke path `/Users/fachrulrozi/PhpstormProjects/...`. Chunk ≤30 baris untuk file panjang. |
| **Edit file di lokal** | Desktop Commander `edit_block` | Find/replace presisi. |
| **Buat folder lokal** | Desktop Commander `create_directory` | |
| **Transfer ke server (scp)** | Desktop Commander `start_process` | Jalankan perintah `scp` dari shell Mac. |
| **Eksekusi perintah di server** | MCP tool `ssh-layanan-aplikasi:exec` | Buat folder, lint PHP, `artisan migrate`, query MySQL. **Batas 1000 karakter per command.** |

### Pola perintah SCP yang dipakai
```bash
scp -P 2223 -o StrictHostKeyChecking=accept-new \
  /Users/fachrulrozi/PhpstormProjects/uangku.layanan-aplikasi.com/<file> \
  layr1858@layanan-aplikasi.com:/home/layr1858/public_html/uangku.layanan-aplikasi.com/<tujuan>/
```

### Workflow standar tiap perubahan
1. Tulis / edit file di **lokal** (Desktop Commander `write_file` / `edit_block`).
2. Pastikan folder tujuan ada di server (`ssh-layanan-aplikasi:exec` → `mkdir -p ...`).
3. **scp** file lokal → server (`start_process`).
4. Verifikasi di server: `php -l <file>` (lint), lalu jalankan (`migrate` / `db:seed` / skrip test).
5. Bersihkan file test & data demo dari server setelah verifikasi.

> **Penting:** `ssh-layanan-aplikasi:exec` punya batas 1000 karakter. Untuk skrip uji panjang:
> tulis file `.php` di lokal → scp ke server → jalankan `php namafile.php` → hapus setelah selesai.

---

## 3. Arsitektur Keputusan

- **Multi-tenant: Shared DB** — semua tabel transaksional dipisah via kolom `company_id`
  (FK ke `companies`, `cascadeOnDelete`).
- **Definisi 1 transaksi (untuk kuota)** = `invoice` + `purchase_order` + `bank_transaction`.
  Direkap per company per bulan di tabel `transaction_usages`.
- **3 Tier langganan**: Free / Premium / Ultimate.

---

## 4. Skema Database (24 tabel di `layr1858_lara767`)

### Tabel bawaan Laravel (sudah ada sebelumnya, tidak disentuh)
`users` *(ditambah `company_id` + `is_super_admin`)*, `cache`, `cache_locks`, `jobs`,
`job_batches`, `failed_jobs`, `password_reset_tokens`, `sessions`, `migrations`.

### Tabel SaaS / Multi-tenant (baru)
| Tabel | Fungsi |
|---|---|
| `plans` | Master paket: code, name, price, max_transactions, max_reports, is_customizable, features (JSON) |
| `companies` | Tenant. Punya `code` (company code unik), plan_id, status (active/suspended/trial) |
| `subscriptions` | Langganan per company. **Snapshot** price + max_transactions + max_reports (Premium bisa di-override admin) |
| `transaction_usages` | Rekap pemakaian per company per periode (YYYY-MM): invoice_count, po_count, bank_tx_count, total_count, report_count |

### Tabel domain Uangku (baru, semua punya `company_id`)
| Modul | Tabel |
|---|---|
| Akuntansi | `chart_of_accounts`, `journals`, `journal_entries` |
| Penjualan | `customers`, `invoices`, `invoice_items` |
| Pembelian | `vendors`, `purchase_orders`, `purchase_order_items` |
| Kas & Bank | `bank_accounts`, `bank_transactions` |
| Payroll & SDM | `employees`, `payrolls` |
| Pajak | `tax_records` |
| Anggaran | `budgets` |

---

## 5. Tier Langganan (sudah ter-seed di DB)

| Plan | code | Harga (IDR) | Maks Transaksi | Maks Laporan | is_customizable |
|---|---|---|---|---|---|
| Free | `free` | 0 | 100 / bulan | 5 | tidak |
| Premium | `premium` | 199.000 *(default)* | 2.000 *(default)* | 100 | **ya** |
| Ultimate | `ultimate` | 499.000 | unlimited (NULL) | unlimited (NULL) | tidak |

- **Premium**: harga & limit disimpan di `subscriptions` (snapshot per company) → admin bisa override
  tanpa ubah kode.
- **Ultimate**: `max_transactions` & `max_reports` = `NULL` → diartikan unlimited.

---

## 6. File yang Dibuat

### Migrations — `database/migrations/`
**Tabel SaaS (timestamp 090xxx, jalan sebelum FK):**
- `2026_06_02_090001_create_plans_table.php`
- `2026_06_02_090002_create_companies_table.php`
- `2026_06_02_090003_create_subscriptions_table.php`
- `2026_06_02_090004_create_transaction_usages_table.php`

**Tabel domain (timestamp 100xxx):**
- `2026_06_02_100001_create_chart_of_accounts_table.php`
- `2026_06_02_100002_create_customers_table.php`
- `2026_06_02_100003_create_vendors_table.php`
- `2026_06_02_100004_create_bank_accounts_table.php`
- `2026_06_02_100005_create_employees_table.php`
- `2026_06_02_100010_create_journals_table.php`
- `2026_06_02_100011_create_journal_entries_table.php`
- `2026_06_02_100012_create_invoices_table.php`
- `2026_06_02_100013_create_invoice_items_table.php`
- `2026_06_02_100014_create_purchase_orders_table.php`
- `2026_06_02_100015_create_purchase_order_items_table.php`
- `2026_06_02_100016_create_bank_transactions_table.php`
- `2026_06_02_100017_create_payrolls_table.php`
- `2026_06_02_100018_create_tax_records_table.php`
- `2026_06_02_100019_create_budgets_table.php`

**Tambah kolom company_id (jalan terakhir):**
- `2026_06_02_100100_add_company_id_to_tables.php`
  → menambah `company_id` ke 15 tabel domain (cascade) + ke `users` (nullable) + `is_super_admin` ke `users`.

### Models — `app/Models/`
`Plan.php`, `Company.php`, `Subscription.php`, `TransactionUsage.php`,
`ChartOfAccount.php`, `Customer.php`, `Vendor.php`, `BankAccount.php`, `BankTransaction.php`,
`Employee.php`, `Journal.php`, `JournalEntry.php`, `Invoice.php`, `InvoiceItem.php`,
`PurchaseOrder.php`, `PurchaseOrderItem.php`, `Payroll.php`, `TaxRecord.php`, `Budget.php`,
dan `User.php` (diperluas: fillable + cast `company_id`/`is_super_admin`, relasi `company()`, `isSuperAdmin()`).

- **Trait** `app/Models/Concerns/BelongsToCompany.php`
  - Global scope: query otomatis ter-filter `company_id` user yang login (kecuali super-admin).
  - `creating`: auto-isi `company_id` saat membuat record baru.
  - Relasi `company()`.

### Seeders — `database/seeders/`
- `PlanSeeder.php` — isi 3 plan (sudah dijalankan).
- `ChartOfAccountSeeder.php` — 31 akun standar PSAK. Method statik
  `ChartOfAccountSeeder::seedForCompany($companyId)`. (CoA bersifat per-company.)

### Observer — `app/Observers/`
- `CompanyObserver.php` — saat `Company` dibuat → otomatis `ChartOfAccountSeeder::seedForCompany()`.
- Didaftarkan via atribut `#[ObservedBy(CompanyObserver::class)]` di `app/Models/Company.php`.

### Middleware — `app/Http/Middleware/`
- `EnforceTransactionQuota.php` — blokir pembuatan transaksi bila kuota bulan berjalan habis.
  - Super-admin & plan unlimited → dilewati.
  - Kuota habis → HTTP 429 (JSON) / redirect-back with errors (web).
- Alias `quota` didaftarkan di `bootstrap/app.php` (`$middleware->alias([...])`).

---

## 7. Perintah Penting

### Migrate (di server)
```bash
cd /home/layr1858/public_html/uangku.layanan-aplikasi.com
php artisan migrate:status        # cek status
php artisan migrate --force       # jalankan (produksi → wajib --force)
```

### Seed plan
```bash
php artisan db:seed --class=PlanSeeder --force
```

### Cek tabel / data via MySQL
```bash
mysql -u layr1858_lara767 -p'<password dari .env>' layr1858_lara767 -e "SHOW TABLES;"
```

---

## 8. Cara Pakai (untuk pengembangan controller/route berikutnya)

### Provisioning company baru
```php
// CoA standar PSAK otomatis terisi lewat CompanyObserver
$company = Company::create([
    'code'   => 'PT001',
    'name'   => 'PT Nama Perusahaan',
    'plan_id'=> Plan::where('code','free')->value('id'),
    'status' => 'active',
]);

// Buat langganan (snapshot harga + limit)
$plan = $company->plan;
Subscription::create([
    'company_id'       => $company->id,
    'plan_id'          => $plan->id,
    'price'            => $plan->price,
    'max_transactions' => $plan->max_transactions, // bisa di-override utk Premium
    'max_reports'      => $plan->max_reports,
    'status'           => 'active',
    'starts_at'        => now(),
]);
```

### Enforcement kuota di route
```php
Route::post('/invoices', [InvoiceController::class, 'store'])->middleware(['auth','quota']);
Route::post('/purchase-orders', [PurchaseOrderController::class, 'store'])->middleware(['auth','quota']);
Route::post('/bank-transactions', [BankTransactionController::class, 'store'])->middleware(['auth','quota']);
```

### Catat pemakaian saat transaksi berhasil dibuat
```php
TransactionUsage::recordUsage($company->id, 'invoice'); // 'invoice' | 'po' | 'bank'
```

### Cek kuota manual
```php
$company->canAddTransaction(); // true jika masih boleh, false jika kuota habis (unlimited → selalu true)
```

> **Penting:** method bernama `recordUsage` (BUKAN `increment` — itu bentrok dengan method bawaan Eloquent).

---

## 9. Status Verifikasi

- 24 tabel ter-migrate, semua `DONE`. 14 foreign key terpasang.
- 3 plan ter-seed (Free/Premium/Ultimate) — terverifikasi di DB.
- Observer diuji: `Company::create()` → 31 akun CoA otomatis.
- Kuota diuji: 100/100 → tolak; 99/100 → boleh.
- Trait tenant-scope & auto-isi `company_id` berfungsi.
- DB produksi **bersih** dari data demo (companies/coa/subs/usages = 0; plans = 3).

---

## 10. Belum Dikerjakan / Langkah Lanjutan

- [ ] Observer `recordUsage` otomatis di model `Invoice` / `PurchaseOrder` / `BankTransaction`
      (saat `created`) → menutup lingkaran enforcement kuota tanpa panggil manual di controller.
- [ ] Enforcement kuota laporan (`max_reports` / `report_count`).
- [ ] Controller + route + resource (CRUD) per modul.
- [ ] Auth context: cara set `company_id` & `is_super_admin` pada user saat registrasi/login.
- [ ] Admin panel: kelola plan, override harga/limit Premium per company, suspend company.
- [ ] Logic akuntansi: generate jurnal double-entry otomatis dari invoice/PO/payroll.
- [ ] Factory + seeder data dummy untuk testing.
- [ ] Index tambahan untuk performa query multi-tenant (mis. composite `company_id` + tanggal/status).
