# Uangku — API Layer (Implementasi Server, Selesai)

> Lanjutan dari UANGKU_RINGKAS.md. Mencatat implementasi REST API yang sudah jalan & teruji di server.

## Auth & Setup
- **Laravel Sanctum v4.3.2** terpasang (token-based, untuk web + mobile native).
- `composer.phar` diunduh manual ke root server (tidak ada composer global). Install: `php composer.phar require ...`.
- `User` model: tambah trait `HasApiTokens`.
- `bootstrap/app.php`: aktifkan `api: routes/api.php`, prefix `api`, alias middleware `quota` + `superadmin`.
- Migration `personal_access_tokens` sudah jalan.

## Endpoint (`/api/v1`, 26 route) — semua teruji
**Publik:** `POST auth/register`, `POST auth/login`
**Auth (sanctum):** `GET auth/me`, `POST auth/logout`
**Master:** `GET|POST customers`, `GET|POST vendors`, `GET bank-accounts`, `GET chart-of-accounts`
**Transaksi (read):** `GET invoices|invoices/{id}`, `GET purchase-orders|/{id}`, `GET bank-transactions`
**Transaksi (create, middleware `quota`):** `POST invoices`, `POST purchase-orders`, `POST bank-transactions`
**Transaksi (delete):** `DELETE` untuk ketiganya
**Laporan:** `GET reports/balance-sheet?date=`, `GET reports/cash-flow?from=&to=`
**Usage:** `GET usage/current`
**Super admin (middleware `superadmin`):** `GET admin/registrations?status=`, `POST admin/registrations/{company}/approve`, `POST .../reject`, `PATCH admin/companies/{company}/subscription`

## Komponen Server Baru
- `app/Http/Controllers/Api/` — AuthController, AdminController, InvoiceController, PurchaseOrderController, BankTransactionController, ReportController, MasterController, UsageController
- `app/Services/JournalPoster.php` — posting jurnal double-entry seimbang (dipakai semua transaksi)
- `app/Http/Middleware/EnsureSuperAdmin.php` — alias `superadmin`
- `routes/api.php`

## Logika Akuntansi (jurnal otomatis saat transaksi dibuat)
- **Invoice:** D Piutang(1104) ; K Penjualan(4101) + PPN Keluaran(2102)
- **PO:** D Beban(5103) + PPN Masukan(1106) ; K Hutang Usaha(2101)
- **Bank in:** D Bank(1103) ; K Pendapatan Lain(4102). **Bank out:** D Beban(5103) ; K Bank(1103)
- Setiap transaksi sukses → `TransactionUsage::recordUsage()` (kuota naik) + dibungkus `DB::transaction`.

## Laporan
- **Neraca:** saldo per akun dari journal_entries (posted). Revenue−expense diakumulasi jadi **Laba Berjalan (3199)** di ekuitas → neraca seimbang. Teruji: aset=liab+ekuitas.
- **Arus kas:** mutasi akun kas & bank (1101/1102/1103) dalam periode + saldo awal/akhir.

## Alur Approval (registrasi)
1. `POST auth/register` → buat company (status `trial`) + user (belum bisa login).
2. Login ditolak (403) selama company belum `active`.
3. Super admin `POST admin/registrations/{company}/approve` (body: `plan_code`, opsional override `price/max_transactions/max_reports` utk Premium) → company `active` + buat subscription. CoA 31 akun otomatis (observer saat company dibuat).

## Status Uji (end-to-end di server)
- register → approve → buat customer → POST invoice → jurnal seimbang (D=C) → kuota naik → neraca seimbang. Semua PASS.
- 26 route terdaftar, semua file lolos `php -l`.
- DB produksi bersih: companies/invoices/journals/users=0, plans=3, tokens=0.

## Catatan / Lanjutan
- Cascade delete company terhalang FK `journal_entries.coa_id` (restrictOnDelete) — hapus company perlu urutan manual (anak dulu) atau soft-delete. Pertimbangkan strategi arsip, bukan hard delete.
- Belum: email notifikasi approval, payment recording invoice, laporan laba-rugi, rate limiting API, API Resource formal (saat ini return model langsung), test otomatis (PHPUnit).
- Web React (UangkuApp.jsx) masih pakai state lokal — belum disambungkan ke API ini.
