<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // Middleware 'superadmin' memastikan hanya super admin yang akses.

    public function plans()
    {
        return response()->json(Plan::where('is_active', true)->orderBy('price')->get());
    }

    public function registrations(Request $request)
    {
        $status = $request->query('status', 'trial');
        $companies = Company::where('status', $status)
            ->with('users:id,company_id,name,email')
            ->latest()
            ->paginate(20);

        return response()->json($companies);
    }

    public function approve(Request $request, Company $company)
    {
        $data = $request->validate([
            'plan_code' => ['required', 'in:free,premium,ultimate'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'max_transactions' => ['nullable', 'integer', 'min:0'],
            'max_reports' => ['nullable', 'integer', 'min:0'],
        ]);

        $plan = Plan::where('code', $data['plan_code'])->firstOrFail();

        $company->update(['status' => 'active', 'plan_id' => $plan->id]);

        // Premium: izinkan override harga/limit dari admin. Lainnya: pakai default plan.
        Subscription::updateOrCreate(
            ['company_id' => $company->id, 'status' => 'active'],
            [
                'plan_id' => $plan->id,
                'price' => $plan->is_customizable ? ($data['price'] ?? $plan->price) : $plan->price,
                'max_transactions' => $plan->is_customizable ? ($data['max_transactions'] ?? $plan->max_transactions) : $plan->max_transactions,
                'max_reports' => $plan->is_customizable ? ($data['max_reports'] ?? $plan->max_reports) : $plan->max_reports,
                'starts_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Company disetujui dan diaktifkan.',
            'company' => $company->fresh()->only(['id', 'name', 'status', 'plan_id']),
        ]);
    }

    public function reject(Request $request, Company $company)
    {
        $request->validate(['reason' => ['nullable', 'string', 'max:500']]);
        $company->update(['status' => 'suspended']);

        return response()->json(['message' => 'Registrasi ditolak.']);
    }

    public function updateSubscription(Request $request, Company $company)
    {
        $data = $request->validate([
            'price' => ['nullable', 'numeric', 'min:0'],
            'max_transactions' => ['nullable', 'integer', 'min:0'],
            'max_reports' => ['nullable', 'integer', 'min:0'],
        ]);

        $sub = $company->activeSubscription();
        if (! $sub) {
            return response()->json(['message' => 'Tidak ada langganan aktif.'], 404);
        }
        $sub->update(array_filter($data, fn ($v) => ! is_null($v)));

        return response()->json(['message' => 'Langganan diperbarui.', 'subscription' => $sub->fresh()]);
    }
}
