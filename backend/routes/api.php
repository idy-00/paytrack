<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AtaabaAdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OtpController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MobilePaymentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierOrderController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\Webhook\DexpayWebhookController;
use App\Http\Controllers\Api\Webhook\FreeMoneyWebhookController;
use App\Http\Controllers\Api\Webhook\IntechWebhookController;
use App\Http\Controllers\Api\Webhook\OrangeMoneyWebhookController;
use App\Http\Controllers\Api\Webhook\WaveWebhookController;
use App\Http\Middleware\CheckPlanFeature;
use App\Http\Middleware\CheckSubscription;
use App\Http\Middleware\EnsureTenantAccess;
use Illuminate\Support\Facades\Route;

// ── Public routes — no auth ───────────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1');

    // OAuth Social Login
    Route::get('/google', [SocialAuthController::class, 'redirectGoogle']);
    Route::get('/google/callback', [SocialAuthController::class, 'callbackGoogle']);
    Route::get('/apple', [SocialAuthController::class, 'redirectApple']);
    Route::post('/apple/callback', [SocialAuthController::class, 'callbackApple']);
});

// OTP routes — rate limited
Route::prefix('otp')->middleware('throttle:10,1')->group(function () {
    Route::post('/send', [OtpController::class, 'send']);
    Route::post('/verify', [OtpController::class, 'verify']);
    Route::post('/reset-password', [OtpController::class, 'resetPassword']);
});

// Public QR — masked name, status only, no amounts
Route::get('/qr/{uuid}', [SaleController::class, 'publicQr'])
    ->where('uuid', '[0-9a-f-]{36}');

// ── Webhooks — no auth (signature verification inside the controller) ─────────
// CSRF is exempt because these are server-to-server POST calls.
// Laravel's VerifyCsrfToken middleware is web-only; API routes use Sanctum tokens.
Route::prefix('webhooks')->middleware('throttle:60,1')->group(function () {
    Route::post('/dexpay',       [DexpayWebhookController::class, 'handle'])->name('webhooks.dexpay');
});

// ── Public subscription plans ─────────────────────────────────────────────────
Route::get('/plans', [SubscriptionController::class, 'plans']);

// ── Public order QR ───────────────────────────────────────────────────────────
Route::get('/order-qr/{uuid}', [OrderController::class, 'publicQr'])
    ->where('uuid', '[0-9a-f-]{36}');

// ── Authenticated routes ──────────────────────────────────────────────────────

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);

    // Notifications du compte
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    // Sales
    Route::get('/sales',          [SaleController::class, 'index']);
    Route::post('/sales',         [SaleController::class, 'store']);
    Route::get('/sales/{sale}',   [SaleController::class, 'show']);

    // Payments
    Route::get('/payments', [PaymentController::class, 'index']);
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

    // Admin routes (admin_entreprise only)
    Route::prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/reports', [AdminController::class, 'reports']);
        Route::get('/activity', [AdminController::class, 'activity']);
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
    });

    // ── Subscription management ───────────────────────────────────────────────
    Route::prefix('subscription')->group(function () {
        Route::get('/current', [SubscriptionController::class, 'current']);
        Route::post('/change-plan', [SubscriptionController::class, 'changePlan']);
        Route::post('/assisted-setup', [SubscriptionController::class, 'requestAssistedSetup']);
        Route::get('/invoices', [SubscriptionController::class, 'invoices']);
        Route::post('/invoices/{invoice}/pay', [SubscriptionController::class, 'payInvoice']);
        Route::post('/renew', [SubscriptionController::class, 'createRenewalInvoice']);
    });

    // ── Wallet ────────────────────────────────────────────────────────────────
    Route::prefix('wallet')->group(function () {
        Route::get('/', [WalletController::class, 'show']);
        Route::get('/transactions', [WalletController::class, 'transactions']);
        Route::post('/withdraw/quote', [WalletController::class, 'withdrawalQuote']);
        Route::post('/withdraw', [WalletController::class, 'requestWithdrawal']);
        Route::get('/withdrawals', [WalletController::class, 'withdrawalHistory']);
    });

    // ── KYC (Know Your Customer) ──────────────────────────────────────────────
    Route::prefix('kyc')->group(function () {
        Route::get('/status', [KycController::class, 'status']);
        Route::post('/upload', [KycController::class, 'upload']);
        Route::get('/documents/{document}/download', [KycController::class, 'download']);
    });

    // ── Orders (customer orders) ──────────────────────────────────────────────
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']);
        Route::get('/{order}', [OrderController::class, 'show']);
        Route::put('/{order}/status', [OrderController::class, 'updateStatus']);
        Route::post('/{order}/payments', [OrderController::class, 'recordPayment']);
        Route::post('/{order}/pay-online', [OrderController::class, 'initiateOnlinePayment']);
    });

    // ── Stock management ──────────────────────────────────────────────────────
    Route::prefix('stock')->group(function () {
        Route::get('/overview', [StockController::class, 'overview']);
        Route::get('/movements', [StockController::class, 'movements']);
        Route::post('/adjust', [StockController::class, 'adjustStock']);
        Route::get('/alerts', [StockController::class, 'alerts']);
        Route::get('/top-selling', [StockController::class, 'topSelling']);
    });

    // ── Inventories (advanced stock - plan feature) ───────────────────────────
    Route::prefix('inventories')->middleware('plan_feature:advanced_stock')->group(function () {
        Route::get('/', [StockController::class, 'inventories']);
        Route::post('/', [StockController::class, 'createInventory']);
        Route::get('/{inventory}', [StockController::class, 'showInventory']);
        Route::put('/{inventory}/items/{item}', [StockController::class, 'updateInventoryItem']);
        Route::post('/{inventory}/complete', [StockController::class, 'completeInventory']);
        Route::delete('/{inventory}', [StockController::class, 'cancelInventory']);
    });

    // ── Suppliers (plan feature: supplier_orders) ─────────────────────────────
    Route::middleware('plan_feature:supplier_orders')->group(function () {
        Route::apiResource('suppliers', SupplierController::class);
        Route::get('/suppliers-debts', [SupplierController::class, 'debts']);

        Route::prefix('supplier-orders')->group(function () {
            Route::get('/', [SupplierOrderController::class, 'index']);
            Route::post('/', [SupplierOrderController::class, 'store']);
            Route::get('/{supplierOrder}', [SupplierOrderController::class, 'show']);
            Route::put('/{supplierOrder}/status', [SupplierOrderController::class, 'updateStatus']);
            Route::post('/{supplierOrder}/receive', [SupplierOrderController::class, 'receiveItems']);
            Route::post('/{supplierOrder}/payments', [SupplierOrderController::class, 'recordPayment']);
        });
    });
});

// ── ATAABA Super Admin routes (separate auth + role check) ────────────────────
Route::prefix('ataaba-admin')->middleware(['auth:sanctum', 'super_admin'])->group(function () {
    Route::get('/dashboard', [AtaabaAdminController::class, 'dashboard']);
    Route::get('/tenants', [AtaabaAdminController::class, 'tenants']);
    Route::get('/tenants/{tenant}', [AtaabaAdminController::class, 'tenantDetail']);
    Route::put('/tenants/{tenant}/limits', [AtaabaAdminController::class, 'updateTenantLimits']);
    Route::get('/subscriptions', [AtaabaAdminController::class, 'subscriptions']);
    Route::get('/invoices', [AtaabaAdminController::class, 'invoices']);
    Route::get('/assisted-setup', [AtaabaAdminController::class, 'assistedSetupRequests']);
    Route::post('/assisted-setup/{subscription}/done', [AtaabaAdminController::class, 'markAssistedSetupDone']);
    Route::get('/withdrawals', [AtaabaAdminController::class, 'withdrawalRequests']);
    Route::post('/withdrawals/{withdrawal}/process', [AtaabaAdminController::class, 'processWithdrawal']);
    Route::get('/expiring', [AtaabaAdminController::class, 'expiringSubscriptions']);
    Route::get('/plans', [AtaabaAdminController::class, 'plans']);
    Route::put('/plans/{plan}', [AtaabaAdminController::class, 'updatePlan']);
    Route::get('/intech-balance', [AtaabaAdminController::class, 'intechBalance']);
    Route::get('/kyc-documents', [AtaabaAdminController::class, 'kycDocuments']);
    Route::post('/kyc-documents/{document}/review', [AtaabaAdminController::class, 'reviewKycDocument']);

    // Gestion fonds carte (retenus, réserves, chargebacks)
    Route::get('/card-funds', [AtaabaAdminController::class, 'cardFundsDashboard']);
    Route::get('/held-transactions', [AtaabaAdminController::class, 'heldTransactions']);
    Route::post('/held-transactions/{transaction}/release', [AtaabaAdminController::class, 'releaseHeldFunds']);
    Route::get('/reserves', [AtaabaAdminController::class, 'reserves']);
    Route::post('/reserves', [AtaabaAdminController::class, 'createReserve']);
    Route::post('/reserves/{reserve}/release', [AtaabaAdminController::class, 'releaseReserve']);
    Route::post('/reserves/{reserve}/chargeback', [AtaabaAdminController::class, 'convertToChargeback']);
    Route::post('/chargeback', [AtaabaAdminController::class, 'applyChargeback']);
});
