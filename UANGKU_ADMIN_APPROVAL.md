# Uangku — Halaman Super Admin Approval (Selesai)

> Lanjutan dari UANGKU_WEB_IMPLEMENTASI.md.

## Yang ditambahkan
- **Halaman approval** `resources/js/pages/admin/Approval.jsx` — tab Menunggu/Aktif/Ditolak, kartu per company + user, modal approve (pilih plan; Premium bisa override harga/maks tx/maks laporan), tombol tolak.
- **Menu sidebar "Persetujuan"** di `Shell.jsx` — hanya tampil jika `user.is_super_admin`.
- **Route SPA** `/admin/approval` di `app.jsx`.
- **Endpoint baru** `GET /api/v1/admin/plans` (AdminController@plans) + ditambah ke `adminApi.plans()`.
- **Command artisan** `php artisan uangku:super-admin {name} {email} {password}` — buat akun super admin (company_id null, is_super_admin true). File: `app/Console/Commands/CreateSuperAdmin.php`.

## Cara buat super admin (di server)
```bash
cd /home/layr1858/public_html/uangku.layanan-aplikasi.com
php artisan uangku:super-admin "Nama" "email@domain" "password"
```

## Alur approval (teruji end-to-end via HTTP)
1. Calon klien `POST /auth/register` → company status `trial`, user belum bisa login (403).
2. Super admin login → menu Persetujuan → tab "Menunggu" → daftar company trial.
3. Klik Setujui → pilih plan (Premium: isi harga/limit khusus) → `POST /admin/registrations/{id}/approve`.
4. Company jadi `active`, subscription dibuat (snapshot harga+limit), 31 akun CoA otomatis.
5. User company tsb sekarang bisa login. (Tolak → status `suspended`.)

Hasil uji: register→pending, login super admin, list pending, approve premium (override harga 250rb/maks 3000) → company active + subscription sesuai override + CoA 31, user yang tadinya 403 kini login sukses. Semua PASS. Data uji dibersihkan (plans=3, sisanya 0).

## Deploy (sudah dilakukan)
- Backend: scp AdminController.php, routes/api.php, CreateSuperAdmin.php.
- Frontend: `npm run build` di Mac → hapus `public/build/assets/*` lama di server → scp `public/build/*`.
- Build hash saat ini: app-BJJEHtKN.js / app-DuKRcuXM.css. `/admin/approval` → 200.

## Lanjutan
- Master data UI (customer/vendor/bank/CoA), grafik arus kas bulanan, email notifikasi approval, payment recording, laporan laba-rugi.
