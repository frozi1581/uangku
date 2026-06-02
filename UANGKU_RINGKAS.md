# Uangku — Ringkasan Implementasi DB (untuk Instruction)

## Akses
- **Local:** `/Users/fachrulrozi/PhpstormProjects/uangku.layanan-aplikasi.com`
- **Server:** `/home/layr1858/public_html/uangku.layanan-aplikasi.com`
- **SSH (passwordless):** `ssh layr1858@layanan-aplikasi.com -p 2223`
- **Stack:** Laravel 11.53 · PHP 8.3 · MariaDB 10.11 · DB `layr1858_lara767` (kredensial di `.env` server)

## Tools & Workflow
- **Tulis/edit file lokal:** Desktop Commander (`write_file`, `edit_block`, `create_directory`)
- **scp ke server:** Desktop Commander `start_process` →
  `scp -P 2223 -o StrictHostKeyChecking=accept-new <file-lokal> layr1858@layanan-aplikasi.com:<path-server>`
- **Eksekusi di server:** `ssh-layanan-aplikasi:exec` (lint, migrate, query MySQL). **Batas 1000 char/command.**
- **Alur:** tulis lokal → `mkdir -p` folder server → scp → `php -l` + jalankan → hapus file/data test.
- Skrip uji panjang: tulis `.php` lokal → scp → `php file.php` → hapus.

## Arsitektur
- **Multi-tenant shared DB** — semua tabel domain punya `company_id` (FK `companies`, cascade).
- **1 transaksi (kuota)** = invoice + purchase_order + bank_transaction; direkap di `transaction_usages` per company/bulan.
- **3 tier:** Free (100 tx/bln, 5 laporan), Premium (harga & limit di-set admin), Ultimate (unlimited).

## DB: 24 tabel
- **SaaS:** `plans`, `companies` (punya `code`), `subscriptions` (snapshot harga+limit), `transaction_usages`
- **Domain (semua + company_id):** chart_of_accounts, journals, journal_entries, customers, invoices, invoice_items, vendors, purchase_orders, purchase_order_items, bank_accounts, bank_transactions, employees, payrolls, tax_records, budgets
- **users** ditambah `company_id` + `is_super_admin`

## Komponen Kode
- **Models** `app/Models/` — 19 model domain + Plan/Company/Subscription/TransactionUsage + User (diperluas)
- **Trait** `Concerns/BelongsToCompany.php` — global scope per-tenant + auto-isi `company_id`
- **Seeder** `PlanSeeder` (3 plan, sudah jalan), `ChartOfAccountSeeder::seedForCompany($id)` (31 akun PSAK)
- **Observer** `CompanyObserver` — auto-seed CoA saat company dibuat (via `#[ObservedBy]` di Company)
- **Middleware** `EnforceTransactionQuota` (alias `quota` di `bootstrap/app.php`) — blokir saat kuota habis (429/redirect)

## Pakai
```php
Company::create([...]);                          // CoA otomatis terisi (observer)
TransactionUsage::recordUsage($companyId, 'invoice'); // 'invoice'|'po'|'bank'
$company->canAddTransaction();                   // false jika kuota habis
Route::post('/invoices', ...)->middleware(['auth','quota']);
```
> Method = `recordUsage` (BUKAN `increment` — bentrok dgn Eloquent). Ultimate: max=NULL → unlimited.

## Status
24 tabel migrated (14 FK), 3 plan ter-seed, observer & kuota teruji, DB produksi bersih dari data demo.

## Lanjutan
Observer `recordUsage` otomatis di Invoice/PO/BankTransaction · enforcement kuota laporan · controller+route CRUD · auth context (set company_id/super_admin) · admin panel kelola plan · jurnal double-entry otomatis · factory data dummy.
