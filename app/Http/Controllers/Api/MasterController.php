<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\ChartOfAccount;
use App\Models\Customer;
use App\Models\Vendor;
use Illuminate\Http\Request;

class MasterController extends Controller
{
    public function customers(Request $request)
    {
        if ($request->isMethod('post')) {
            $data = $request->validate(['name' => ['required', 'string'], 'email' => ['nullable', 'email'], 'phone' => ['nullable', 'string'], 'npwp' => ['nullable', 'string'], 'address' => ['nullable', 'string']]);
            return response()->json(Customer::create($data), 201);
        }
        return response()->json(Customer::where('is_active', true)->get(['id', 'name', 'email', 'npwp']));
    }

    public function vendors(Request $request)
    {
        if ($request->isMethod('post')) {
            $data = $request->validate(['name' => ['required', 'string'], 'email' => ['nullable', 'email'], 'phone' => ['nullable', 'string'], 'npwp' => ['nullable', 'string'], 'address' => ['nullable', 'string']]);
            return response()->json(Vendor::create($data), 201);
        }
        return response()->json(Vendor::where('is_active', true)->get(['id', 'name', 'email', 'npwp']));
    }

    public function bankAccounts(Request $request)
    {
        if ($request->isMethod('post')) {
            $data = $request->validate([
                'bank_name' => ['required', 'string', 'max:255'],
                'account_number' => ['required', 'string', 'max:50'],
                'account_holder' => ['nullable', 'string', 'max:255'],
            ]);
            $account = BankAccount::create([
                'bank_name' => $data['bank_name'],
                'account_number' => $data['account_number'],
                'account_holder' => $data['account_holder'] ?? $data['bank_name'],
                'currency' => 'IDR',
                'type' => 'bank',
                'opening_balance' => 0,
                'current_balance' => 0,
                'is_active' => true,
            ]);
            return response()->json($account, 201);
        }
        return response()->json(BankAccount::where('is_active', true)->get(['id', 'bank_name', 'account_number', 'current_balance']));
    }

    public function chartOfAccounts()
    {
        return response()->json(ChartOfAccount::where('is_active', true)->orderBy('code')->get(['id', 'code', 'name', 'type', 'parent_id']));
    }
}
