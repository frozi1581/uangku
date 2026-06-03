<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    // Arahkan ke halaman consent Google.
    public function redirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    // Callback dari Google: buat/login user, langsung aktif paket Free.
    public function callback()
    {
        $frontend = env('FRONTEND_URL', 'https://uangku.layanan-aplikasi.com');

        try {
            $gUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            return redirect($frontend . '/login?error=' . urlencode('Gagal autentikasi Google.'));
        }

        $user = User::where('google_id', $gUser->getId())
            ->orWhere('email', $gUser->getEmail())
            ->first();

        if (! $user) {
            // User baru: buat company Free aktif otomatis (tanpa approval).
            $user = DB::transaction(function () use ($gUser) {
                $free = Plan::where('code', 'free')->first();

                $company = Company::create([
                    'code' => 'C-' . strtoupper(Str::random(8)),
                    'name' => $gUser->getName() ?: 'Perusahaan Saya', // diisi/diubah saat lengkapi profil
                    'status' => 'active', // langsung aktif (Free)
                    'plan_id' => $free?->id,
                ]);

                if ($free) {
                    Subscription::create([
                        'company_id' => $company->id,
                        'plan_id' => $free->id,
                        'price' => 0,
                        'max_transactions' => $free->max_transactions,
                        'max_reports' => $free->max_reports,
                        'status' => 'active',
                        'starts_at' => now(),
                    ]);
                }

                return User::create([
                    'company_id' => $company->id,
                    'name' => $gUser->getName() ?: 'Pengguna',
                    'email' => $gUser->getEmail(),
                    'google_id' => $gUser->getId(),
                    'avatar' => $gUser->getAvatar(),
                    'profile_completed' => false, // nanti lengkapi nama perusahaan dll
                    'is_super_admin' => false,
                ]);
            });
        } else {
            // User lama: tautkan google_id bila belum.
            if (! $user->google_id) {
                $user->update(['google_id' => $gUser->getId(), 'avatar' => $gUser->getAvatar()]);
            }
            // Super-admin tidak boleh login via Google.
            if ($user->is_super_admin) {
                return redirect($frontend . '/login?error=' . urlencode('Akun super admin tidak dapat login via Google.'));
            }
        }

        $token = $user->createToken('google-web')->plainTextToken;

        // Kirim token ke front-end via query (SPA simpan ke localStorage).
        return redirect($frontend . '/auth/google/success?token=' . $token
            . '&completed=' . ($user->profile_completed ? '1' : '0'));
    }
}
