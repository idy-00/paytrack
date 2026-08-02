<?php

use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MobilePaymentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\Webhook\FreeMoneyWebhookController;
use App\Http\Controllers\Api\Webhook\OrangeMoneyWebhookController;
use App\Http\Controllers\Api\Webhook\WaveWebhookController;
use App\Http\Middleware\EnsureTenantAccess;
use Illuminate\Support\Facades\Route;

// ── Public routes — no auth ───────────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1');
});

// Public QR — masked name, status only, no amounts
Route::get('/qr/{uuid}', [SaleController::class, 'publicQr'])
    ->where('uuid', '[0-9a-f-]{36}');

// ── Webhooks — no auth (signature verification inside the controller) ─────────
// CSRF is exempt because these are server-to-server POST calls.
// Laravel's VerifyCsrfToken middleware is web-only; API routes use Sanctum tokens.
Route::prefix('webhooks')->middleware('throttle:60,1')->group(function () {
    Route::post('/wave',         WaveWebhookController::class);
    Route::post('/orange-money', OrangeMoneyWebhookController::class);
    Route::post('/free-money',   FreeMoneyWebhookController::class);
});

// ── Authenticated routes ──────────────────────────────────────────────────────

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Sales
    Route::get('/sales',          [SaleController::class, 'index']);
    Route::post('/sales',         [SaleController::class, 'store']);
    Route::get('/sales/{sale}',   [SaleController::class, 'show']);

    // Manual payments (cash, recorded by vendor)
    Route::post('/sales/{sale}/payments', [PaymentController::class, 'store']);

    // Mobile money — initiate checkout
    Route::post('/sales/{sale}/mobile-payment', [MobilePaymentController::class, 'initiate']);
    Route::get('/sales/{sale}/mobile-payment/{reference}/status', [MobilePaymentController::class, 'status']);

    // Dashboard
    Route::get('/dashboard/stats',    [DashboardController::class, 'stats']);
    Route::get('/dashboard/activity', [DashboardController::class, 'recentActivity']);
    Route::get('/dashboard/upcoming', [DashboardController::class, 'upcomingSchedules']);

    // Clients
    Route::apiResource('clients', ClientController::class);

    // Articles
    Route::apiResource('articles', ArticleController::class);

    // Shops (admin only)
    Route::apiResource('shops', ShopController::class);

    // Users (admin only)
    Route::apiResource('users', UserController::class)->except(['destroy']);
    Route::post('/users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    Route::post('/users/{user}/assign-role', [UserController::class, 'assignRole']);
    Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);

    // Receipts PDF
    Route::get('/sales/{sale}/receipt', [ReceiptController::class, 'saleReceipt']);
    Route::get('/payments/{payment}/receipt', [ReceiptController::class, 'paymentReceipt']);

    // Exports CSV
    Route::get('/exports/sales', [ExportController::class, 'sales']);
    Route::get('/exports/payments', [ExportController::class, 'payments']);
    Route::get('/exports/overdue', [ExportController::class, 'overdueSchedules']);
});
