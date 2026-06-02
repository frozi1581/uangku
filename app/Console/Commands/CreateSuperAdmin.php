<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateSuperAdmin extends Command
{
    protected $signature = 'uangku:super-admin {name} {email} {password}';
    protected $description = 'Buat akun super admin platform Uangku (tanpa company).';

    public function handle(): int
    {
        $email = $this->argument('email');

        if (User::where('email', $email)->exists()) {
            $this->error("Email {$email} sudah terdaftar.");
            return self::FAILURE;
        }

        $user = User::create([
            'name' => $this->argument('name'),
            'email' => $email,
            'password' => Hash::make($this->argument('password')),
            'company_id' => null,
            'is_super_admin' => true,
        ]);

        $this->info("Super admin dibuat: {$user->name} <{$user->email}> (id={$user->id})");
        return self::SUCCESS;
    }
}
