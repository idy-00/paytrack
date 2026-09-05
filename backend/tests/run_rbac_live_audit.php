<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(ConsoleKernel::class)->bootstrap();

if (config('database.default') !== 'mysql' || config('database.connections.mysql.database') !== 'paytrack_audit') {
    throw new RuntimeException('Safety stop: only paytrack_audit.');
}

$suffix = Str::lower((string) Str::ulid());
Role::firstOrCreate(['name' => 'vendeur', 'guard_name' => 'web']);
Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
$tenant = Tenant::create(['name' => 'Audit RBAC ' . $suffix, 'slug' => 'audit-rbac-' . $suffix]);
$seller = User::forceCreate(['tenant_id' => $tenant->id, 'name' => 'Audit seller', 'email' => 'seller-rbac-' . $suffix . '@example.test', 'password' => 'not-used', 'is_active' => true]);
$seller->assignRole('vendeur');
$super = User::forceCreate(['name' => 'Audit super', 'email' => 'super-rbac-' . $suffix . '@example.test', 'password' => 'not-used', 'is_active' => true]);
$super->assignRole('super_admin');

$kernel = $app->make(HttpKernel::class);
$call = function (string $token, string $method, string $uri) use ($kernel): array {
    // Each call models a separate HTTP request; otherwise Sanctum's request
    // guard would retain the user authenticated by the preceding test call.
    Auth::forgetGuards();
    $request = Request::create($uri, $method, [], [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $token, 'HTTP_ACCEPT' => 'application/json']);
    $response = $kernel->handle($request);
    $kernel->terminate($request, $response);
    return ['status' => $response->getStatusCode(), 'body' => json_decode($response->getContent(), true)];
};

$sellerToken = $seller->createToken('rbac-seller')->plainTextToken;
$superToken = $super->createToken('rbac-super')->plainTextToken;
$proof = [
    'direct_super_has_role' => $super->fresh()->hasRole('super_admin'),
    'direct_super_roles' => $super->fresh()->getRoleNames()->values()->all(),
    'seller_to_ataaba_dashboard' => $call($sellerToken, 'GET', '/api/ataaba-admin/dashboard'),
    'super_to_ataaba_dashboard' => $call($superToken, 'GET', '/api/ataaba-admin/dashboard'),
    'seller_to_tenant_admin_stats' => $call($sellerToken, 'GET', '/api/admin/stats'),
    'seller_without_supplier_pack' => $call($sellerToken, 'GET', '/api/supplier-orders'),
    'seller_without_advanced_stock_pack' => $call($sellerToken, 'GET', '/api/inventories'),
];
echo json_encode($proof, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;

if (
    $proof['seller_to_ataaba_dashboard']['status'] !== 403 ||
    $proof['super_to_ataaba_dashboard']['status'] !== 200 ||
    $proof['seller_to_tenant_admin_stats']['status'] !== 403 ||
    $proof['seller_without_supplier_pack']['status'] !== 403 ||
    $proof['seller_without_advanced_stock_pack']['status'] !== 403
) exit(1);
