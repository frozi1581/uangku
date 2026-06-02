<?php

use Illuminate\Support\Facades\Route;

// SPA: semua route non-API dilayani oleh app.blade.php (React Router yang menangani).
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
