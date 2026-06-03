<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BankTransactionController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MasterController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UsageController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // --- Publik ---
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);

    // --- Perlu login (token Sanctum) ---
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // Master (dropdown)
        Route::match(['get', 'post'], 'customers', [MasterController::class, 'customers']);
        Route::match(['get', 'post'], 'vendors', [MasterController::class, 'vendors']);
        Route::match(['get', 'post'], 'bank-accounts', [MasterController::class, 'bankAccounts']);
        Route::get('chart-of-accounts', [MasterController::class, 'chartOfAccounts']);

        // Transaksi (read bebas; create dibatasi kuota)
        Route::get('invoices', [InvoiceController::class, 'index']);
        Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::get('purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::get('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show']);
        Route::get('bank-transactions', [BankTransactionController::class, 'index']);

        Route::middleware('quota')->group(function () {
            Route::post('invoices', [InvoiceController::class, 'store']);
            Route::post('purchase-orders', [PurchaseOrderController::class, 'store']);
            Route::post('bank-transactions', [BankTransactionController::class, 'store']);
        });

        Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy']);
        Route::delete('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy']);
        Route::delete('bank-transactions/{bankTransaction}', [BankTransactionController::class, 'destroy']);

        // Laporan
        Route::get('reports/balance-sheet', [ReportController::class, 'balanceSheet']);
        Route::get('reports/cash-flow', [ReportController::class, 'cashFlow']);

        // Usage
        Route::get('usage/current', [UsageController::class, 'current']);

        // Periode akuntansi (buka/tutup)
        Route::get('period/current', [\App\Http\Controllers\Api\PeriodController::class, 'current']);
        Route::post('period/advance', [\App\Http\Controllers\Api\PeriodController::class, 'advance']);
        Route::post('period/set-open', [\App\Http\Controllers\Api\PeriodController::class, 'setOpen']);

        // --- Super admin ---
        Route::middleware('superadmin')->prefix('admin')->group(function () {
            Route::get('plans', [AdminController::class, 'plans']);
            Route::get('registrations', [AdminController::class, 'registrations']);
            Route::post('registrations/{company}/approve', [AdminController::class, 'approve']);
            Route::post('registrations/{company}/reject', [AdminController::class, 'reject']);
            Route::patch('companies/{company}/subscription', [AdminController::class, 'updateSubscription']);
        });
    });
});
