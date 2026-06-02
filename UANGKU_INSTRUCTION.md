# Uangku — Instruction / Konteks Project (untuk New Chat)

> Tempel ke instruction agar chat baru langsung paham konteks tanpa menjelaskan dari awal.
> Project: aplikasi keuangan multi-tenant SaaS (Laravel 11 + React) untuk dijual ke banyak perusahaan.

## AKSES
- **Local (Mac):** `/Users/fachrulrozi/PhpstormProjects/uangku.layanan-aplikasi.com`
- **Server:** `/home/layr1858/public_html/uangku.layanan-aplikasi.com`
- **SSH (passwordless):** `ssh layr1858@layanan-aplikasi.com -p 2223`
- **GitHub:** https://github.com/frozi1581/uangku (branch `main`)
- **Live:** https://uangku.layanan-aplikasi.com
- **Stack:** Laravel 11.53 · PHP 8.3 · MariaDB 10.11 · DB `layr1858_lara767` (kredensial di `.env` server) · Sanctum · React 18 + Vite + Tailwind

## TOOLS & WORKFLOW (penting, ikuti persis)
- **Tulis/edit file lokal:** Desktop Commander (`write_file`, `edit_block`, `create_directory`).
- **scp ke server:** Desktop Commander `start_process` →
  `scp -P 2223 -o StrictHostKeyChecking=accept-new <file-lokal> layr1858@layanan-aplikasi.com:<path-server>`
- **Eksekusi di server:** `ssh-layanan-aplikasi:exec`. **Batas 1000 char/command.** Hindari `which` (bisa exit error & gagalkan command).
- **Server TIDAK punya Node/composer global.** Composer = `php composer.phar ...` di root server. React WAJIB di-build di Mac lalu scp.
- **Build front-end (selalu di Mac):** `npm run build` → hapus `public/build/assets/*` lama di server → scp `public/build/*`.
- **Alur standar:** tulis lokal → `mkdir -p` folder server → scp → `php -l` lint + jalankan → hapus file/data uji.
- **Skrip uji panjang:** tulis `.php` lokal → scp → `php file.php` → hapus. Bersihkan data uji dari DB setelah selesai.
- **Git:** setelah perubahan, `git add/commit/push` ke origin main. `.gitignore` sudah benar (abaikan `.env`, `vendor`, `node_modules`, `public/build`, backup, `_*.php`).

## HOSTING (penting)
- Document root domain = folder project, BUKAN `public/`. `.htaccess` root sudah di-rewrite transparan ke `public/`. Backup lama: `.htaccess.backup-*` di server.
- `routes/web.php` = catch-all `/{any?}` (regex exclude `^api`) → `view('app')` → React Router yang menangani.

## ARSITEKTUR DB (24 tabel, sudah migrated)
- **Multi-tenant shared DB**: semua tabel domain punya `company_id` (FK `companies`, cascade). Trait `BelongsToCompany` = auto-scope per tenant + auto-isi `company_id`.
- **1 transaksi (kuota)** = invoice + purchase_order + bank_transaction. Direkap di `transaction_usages` per company/bulan.
- **Tier:** Free (100 tx/bln, 5 laporan), Premium (harga+limit di-set admin, customizable), Ultimate (max=NULL→unlimited). Tabel: `plans`, `companies` (punya `code`+`status` trial/active/suspended), `subscriptions` (snapshot harga+limit).
- Domain: chart_of_accounts, journals, journal_entries, customers, invoices, invoice_items, vendors, purchase_orders, purchase_order_items, bank_accounts, bank_transactions, employees, payrolls, tax_records, budgets. `users` punya `company_id`+`is_super_admin`.

## KOMPONEN KODE
- **Models** `app/Models/` (20) + trait `Concerns/BelongsToCompany`.
- **Observer** `CompanyObserver` (auto-seed 31 akun CoA PSAK saat company dibuat, via `#[ObservedBy]`).
- **Services** `JournalPoster` (jurnal double-entry seimbang). Invoice: D Piutang(1104)/K Penjualan(4101)+PPN(2102). PO: D Beban(5103)+PPN Masukan(1106)/K Hutang(2101). Bank in: D Bank(1103)/K 4102; out: D 5103/K Bank(1103).
- **Middleware** `EnforceTransactionQuota` (alias `quota`), `EnsureSuperAdmin` (alias `superadmin`) — di `bootstrap/app.php`.
- **Seeder** `PlanSeeder` (3 plan, sudah jalan), `ChartOfAccountSeeder::seedForCompany($id)`.
- **Command** `php artisan uangku:super-admin "Nama" "email" "password"`.
- **API** `routes/api.php` prefix `/api/v1`, auth `auth:sanctum`.
- **React SPA** `resources/js/`: `app.jsx` (router+Protected/Public), `lib/api.js` (axios+Bearer+handle 401), `lib/auth.jsx` (AuthProvider/useAuth), `components/ui.jsx`, `pages/` (Login, Register, Shell, Dashboard, Transaksi, Neraca, ArusKas, admin/Approval).

## API UTAMA (/api/v1)
- Publik: `POST auth/register` (company→trial, user belum bisa login), `POST auth/login` (403 jika company belum active).
- Auth: `GET auth/me`, `POST auth/logout`. Master: `GET|POST customers|vendors`, `GET bank-accounts|chart-of-accounts`.
- Transaksi: `GET/POST/DELETE invoices|purchase-orders|bank-transactions` (POST pakai middleware `quota`).
- Laporan: `GET reports/balance-sheet?date=`, `GET reports/cash-flow?from=&to=`. Usage: `GET usage/current`.
- Super admin (`superadmin`): `GET admin/plans`, `GET admin/registrations?status=trial|active|suspended`, `POST admin/registrations/{company}/approve` (body plan_code + opsional override price/max_transactions/max_reports utk Premium), `POST .../reject`, `PATCH admin/companies/{company}/subscription`.

## CARA PAKAI (kode)
```php
Company::create([...]);                               // CoA otomatis (observer)
TransactionUsage::recordUsage($companyId,'invoice');  // 'invoice'|'po'|'bank' — BUKAN increment (bentrok Eloquent)
$company->canAddTransaction();                        // false jika kuota habis
```
Neraca: revenue−expense diakumulasi jadi "Laba Berjalan (3199)" di ekuitas agar seimbang.

## STATUS (sudah selesai & teruji)
- 24 tabel migrated, 3 plan ter-seed. API + jurnal otomatis + laporan teruji end-to-end via HTTP. Neraca seimbang.
- Web SPA live: /login /register /dashboard /transaksi /neraca /arus-kas /admin/approval.
- Approval flow teruji (register→approve→user bisa login). Repo GitHub utuh & teruji clone→composer install→npm build dari nol.
- DB produksi BERSIH dari data demo (plans=3, sisanya 0). Selalu bersihkan data uji setelah test.

## BELUM DIKERJAKAN (kandidat lanjutan)
UI master data (customer/vendor/bank/CoA) · grafik arus kas bulanan · email notifikasi approval · payment recording invoice · laporan laba-rugi · API Resource formal (controller msh return model langsung) · test PHPUnit · soft-delete company (hard delete terhalang FK journal_entries.coa_id restrict).
