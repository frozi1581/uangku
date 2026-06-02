# Uangku — Web SPA (React) Tersambung ke API (Selesai)

> Lanjutan dari UANGKU_API_IMPLEMENTASI.md. Front-end React SPA sudah build & live di server.

## Live
- **URL:** https://uangku.layanan-aplikasi.com/ (root) — `/login`, `/register`, `/dashboard`, `/transaksi`, `/neraca`, `/arus-kas`
- Semua halaman 200, asset ter-load, API tersambung. Teruji: register → login (token) → /auth/me → laporan.

## Stack Front-end
- React 18 + react-router-dom 6 + axios + lucide-react, Tailwind 3, Vite 6 (plugin react).
- Build di **Mac** (`npm install && npm run build`), output `public/build/`, lalu scp ke server.
- Server TIDAK punya Node — jangan build di server. Selalu build lokal lalu scp `public/build/`.

## Struktur (resources/js/)
- `app.jsx` — entry: BrowserRouter + Protected/Public routes + AuthProvider.
- `lib/api.js` — axios instance (baseURL `/api/v1`), Bearer token dari localStorage, auto-handle 401. Export: authApi, masterApi, txApi, reportApi, adminApi.
- `lib/auth.jsx` — AuthProvider + useAuth() (login/logout/me, simpan token).
- `components/ui.jsx` — Logo, Pill, Field, Btn, Blobs, fmt(), GRADIENT (fresh/startup look).
- `pages/` — Login, Register, Shell (sidebar+header+usage), Dashboard, Transaksi, Neraca, ArusKas.

## Routing / Hosting (PENTING)
- Document root domain = folder project (BUKAN `public/`). 
- `.htaccess` root di-rewrite agar semua request internal ke `public/` (transparan). Backup lama: `.htaccess.backup-*` di server.
- `routes/web.php`: catch-all `/{any?}` (regex exclude `^api`) → `view('app')` → React Router menangani path.
- `resources/views/app.blade.php`: mount `<div id="app">` + `@vite(['resources/css/app.css','resources/js/app.jsx'])`.

## Build & Deploy (ulangi tiap ada perubahan front-end)
```bash
# di Mac
cd /Users/fachrulrozi/PhpstormProjects/uangku.layanan-aplikasi.com
npm run build
scp -P 2223 -r public/build/* layr1858@layanan-aplikasi.com:/home/layr1858/public_html/uangku.layanan-aplikasi.com/public/build/
# jika ubah view/route:
scp -P 2223 resources/views/app.blade.php layr1858@...:.../resources/views/
```

## Status
- Halaman Login & Register tersambung (register memunculkan state "menunggu approval").
- Input Transaksi: load customer/vendor/bank dari API, submit invoice/PO/bank, tangani 429 kuota.
- Neraca & Arus Kas: tarik dari endpoint laporan; neraca tampil seimbang (termasuk Laba Berjalan).
- DB produksi bersih dari data uji (plans=3).

## Lanjutan
- Halaman super-admin approval (UI) — endpoint sudah ada (adminApi), tinggal page.
- Master data (kelola customer/vendor/bank/CoA) lewat UI.
- Grafik arus kas bulanan (endpoint cash-flow saat ini ringkas; bisa diperkaya per-bulan).
- Email notifikasi approval, payment recording, laporan laba-rugi.
- Pertimbangkan ubah document root domain ke `public/` via cPanel (lebih bersih dari rewrite .htaccess).
