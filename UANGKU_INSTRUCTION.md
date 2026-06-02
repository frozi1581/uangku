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
**Alur utama deploy = via Git (bukan scp lagi):**
1. **Tulis/edit kode di Mac (lokal)** pakai Desktop Commander (`write_file`, `edit_block`, `create_directory`).
2. **Cek dulu sebelum commit:** `php -l` (lint, bisa di Mac yg ada PHP 8.4) untuk error sintaks; tinjau logika; untuk perubahan front-end **WAJIB `npm run build` di Mac** (server tak punya Node) — `public/build` di-track di repo.
3. **Commit & push** ke `origin main`: `git add -A && git commit -m "..." && git push origin main`.
   - Wajib commit+push bila: perubahan kode mau dideploy, perubahan front-end (sudah di-build), penambahan migration/seeder, atau perubahan config/route.
   - Sebelum commit cek tak ada secret: `.gitignore` sudah benar (abaikan `.env`, `vendor`, `node_modules`, backup, `_*.php`). **`public/build` SENGAJA di-track** agar pull memperbarui tampilan.
4. **Di server `git pull`:** `cd /home/layr1858/public_html/uangku.layanan-aplikasi.com && git pull origin main` (via `ssh-layanan-aplikasi:exec`).
   - Server = working copy git, branch `main`, sinkron dgn GitHub. `.env` di-ignore (aman, tak tersentuh pull).
   - Jika pull ABORT karena untracked bentrok: hapus file untracked yg bentrok di server lalu pull lagi.
   - Setelah pull yg mengubah DB: jalankan `php artisan migrate --force` di server. Composer = `php composer.phar ...` (tak ada composer global).
5. **Cek tampilan** di https://uangku.layanan-aplikasi.com.

**Catatan tools:**
- `ssh-layanan-aplikasi:exec` **batas 1000 char/command**. Hindari `which` (exit error bisa gagalkan command).
- **scp masih boleh** sebagai fallback cepat (`scp -P 2223 -o StrictHostKeyChecking=accept-new <lokal> layr1858@layanan-aplikasi.com:<server>`), tapi alur utama = git. Jangan campur scp+git untuk file yg sama (bikin untracked bentrok saat pull).
- **Skrip uji panjang:** tulis `.php` lokal → scp/letakkan di server → `php file.php` → hapus. Selalu bersihkan data uji dari DB setelah test (DB produksi harus bersih: plans=3, sisanya 0).

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
