# Uangku

Platform keuangan multi-tenant (SaaS) untuk banyak perusahaan: akuntansi, transaksi, dan laporan
keuangan (neraca & arus kas) dengan standar PSAK Indonesia. Dibangun dengan **Laravel 11 + React (Vite)**,
API berbasis token (Sanctum) yang dipakai bersama oleh web dan aplikasi mobile native.

## Fitur

- **Multi-tenant** — satu database, data tiap perusahaan dipisah lewat `company_id` (auto-scoped).
- **3 tier langganan** — Free (100 transaksi/bulan), Premium (harga & limit diatur admin), Ultimate (unlimited).
- **Registrasi + approval** — perusahaan daftar via email, diaktifkan oleh super admin.
- **Input transaksi** — invoice, purchase order, transaksi bank; jurnal double-entry dibuat otomatis.
- **Laporan** — Neraca & Arus Kas dihitung dari jurnal.
- **Kuota** — pemakaian transaksi dibatasi sesuai paket (middleware).
- **REST API** `/api/v1` siap untuk web & mobile (Android/iOS).

## Teknologi

Laravel 11 · PHP 8.3+ · MariaDB/MySQL · Laravel Sanctum · React 18 · React Router · Vite · Tailwind CSS · axios

## Persiapan

Butuh: PHP 8.3+, Composer, Node.js 18+, npm, dan MySQL/MariaDB.

```bash
git clone https://github.com/frozi1581/uangku.git
cd uangku

# Dependencies PHP & JS
composer install
npm install

# Konfigurasi
cp .env.example .env
php artisan key:generate
# Edit .env: isi DB_DATABASE, DB_USERNAME, DB_PASSWORD sesuai database Anda

# Migrasi + seed plan default (Free/Premium/Ultimate)
php artisan migrate
php artisan db:seed --class=PlanSeeder

# Build front-end
npm run build      # produksi
# atau: npm run dev   (mode pengembangan)
```

### Membuat super admin

```bash
php artisan uangku:super-admin "Nama" "email@domain.com" "password"
```

Super admin login lewat halaman yang sama, lalu mengakses menu **Persetujuan** untuk
mengaktifkan perusahaan yang mendaftar.

## Struktur Penting

```
app/
  Http/Controllers/Api/   # endpoint REST (auth, transaksi, laporan, admin)
  Http/Middleware/        # EnforceTransactionQuota, EnsureSuperAdmin
  Models/                 # 20 model + trait BelongsToCompany (tenant scope)
  Observers/              # CompanyObserver (auto-seed chart of accounts)
  Services/               # JournalPoster (jurnal double-entry)
database/migrations/      # skema 24 tabel
database/seeders/         # PlanSeeder, ChartOfAccountSeeder
resources/js/             # React SPA (pages, lib/api, lib/auth, components)
routes/api.php            # definisi REST API /api/v1
```

## API

Base URL: `/api/v1` · Auth: Bearer token (Sanctum).

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/auth/register` | Registrasi perusahaan (status pending) |
| POST | `/auth/login` | Login, kembalikan token |
| GET | `/auth/me` | Profil + kuota |
| GET/POST | `/invoices`, `/purchase-orders`, `/bank-transactions` | Transaksi (POST dibatasi kuota) |
| GET | `/reports/balance-sheet` | Neraca |
| GET | `/reports/cash-flow` | Arus kas |
| GET | `/usage/current` | Pemakaian kuota |
| GET/POST | `/admin/registrations`, `/admin/registrations/{id}/approve` | Super admin |

## Catatan Deploy

- Front-end di-build dengan `npm run build`; output `public/build` di-generate (tidak di-commit).
- Jika document root hosting bukan folder `public/`, atur rewrite/`.htaccess` agar mengarah ke `public/`.

## Lisensi

Hak cipta pemilik repositori. Penggunaan internal.
