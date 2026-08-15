<?php
if (!isset($_GET['key']) || $_GET['key'] !== 'paytrack2026') die('No');

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "<pre>";
echo "=== Debug Register ===\n\n";

try {
    DB::beginTransaction();

    echo "1. Creating Tenant...\n";
    $tenant = \App\Models\Tenant::create([
        'name' => 'Test Shop Debug',
        'slug' => 'test-shop-debug-' . \Str::random(4),
        'email' => 'debug@test.com',
        'phone' => '+221770000000',
        'is_active' => true,
    ]);
    echo "   Tenant created: ID={$tenant->id}\n\n";

    echo "2. Creating Shop...\n";
    $shop = \App\Models\Shop::create([
        'tenant_id' => $tenant->id,
        'name' => 'Test Shop Debug',
        'phone' => '+221770000000',
        'is_active' => true,
    ]);
    echo "   Shop created: ID={$shop->id}\n\n";

    echo "3. Creating User...\n";
    $user = \App\Models\User::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'name' => 'Debug User',
        'email' => 'debug@test.com',
        'phone' => '+221770000000',
        'password' => \Hash::make('demo12345'),
        'is_active' => true,
    ]);
    echo "   User created: ID={$user->id}\n\n";

    echo "4. Assigning role...\n";
    $user->assignRole('admin_entreprise');
    echo "   Role assigned!\n\n";

    DB::rollBack();
    echo "=== ALL TESTS PASSED (rolled back) ===\n";

} catch (Exception $e) {
    DB::rollBack();
    echo "\n=== ERROR ===\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
echo "</pre>";
