<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // Registrasi via email -> buat company (status trial/pending) + user admin (belum aktif).
    public function register(Request $request)
    {
        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $company = Company::create([
            'code' => 'C-' . strtoupper(Str::random(8)),
            'name' => $data['company_name'],
            'status' => 'trial', // belum aktif sampai disetujui super admin
        ]);

        $user = User::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_super_admin' => false,
        ]);

        return response()->json([
            'message' => 'Registrasi terkirim. Menunggu persetujuan super admin.',
            'status' => 'pending_approval',
            'company_id' => $company->id,
        ], 201);
    }

    // Login -> hanya company berstatus 'active' yang boleh masuk.
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Email atau kata sandi salah.'], 401);
        }

        if (! $user->is_super_admin) {
            $company = $user->company;
            if (! $company || $company->status !== 'active') {
                return response()->json(['message' => 'Akun Anda belum disetujui super admin.'], 403);
            }
        }

        $token = $user->createToken($data['device_name'] ?? 'api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company_id' => $user->company_id,
                'is_super_admin' => $user->is_super_admin,
            ],
            'company' => $user->company ? [
                'id' => $user->company->id,
                'name' => $user->company->name,
                'plan' => $user->company->plan?->code,
            ] : null,
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $company = $user->company;
        $usage = $company?->currentUsage();
        $sub = $company?->activeSubscription();

        return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'company_id', 'is_super_admin']),
            'company' => $company?->only(['id', 'name', 'code', 'status']),
            'plan' => $sub?->plan?->code,
            'usage' => [
                'period' => now()->format('Y-m'),
                'used' => $usage?->total_count ?? 0,
                'limit' => $sub?->max_transactions,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Berhasil keluar.']);
    }
}
