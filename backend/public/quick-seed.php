<?php
$secret = 'paytrack2026';
if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    die('Access denied.');
}

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Shop;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

echo "<pre>";
echo "=== PayTrack Quick Seed ===\n\n";

try {
    // Create tenant first
    $tenant = Tenant::firstOrCreate(
        ['name' => 'PayTrack Demo'],
        ['domain' => 'demo.paytrack.com']
    );
    echo "Tenant: {$tenant->name} (ID: {$tenant->id})\n";

    // Create shop
    $shop = Shop::firstOrCreate(
        ['name' => 'PayTrack Demo', 'tenant_id' => $tenant->id],
        ['address' => 'Dakar, Sénégal', 'phone' => '+221771234567']
    );
    echo "Shop: {$shop->name} (ID: {$shop->id})\n";

    // Create admin
    $admin = User::updateOrCreate(
        ['email' => 'admin@paytrack.com'],
        [
            'name' => 'Admin PayTrack',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'shop_id' => $shop->id,
            'tenant_id' => $tenant->id,
        ]
    );
    echo "Admin: {$admin->email} / password\n";

    // Create vendeur
    $vendeur = User::updateOrCreate(
        ['email' => 'vendeur@paytrack.com'],
        [
            'name' => 'Fatou Vendeur',
            'password' => Hash::make('password'),
            'role' => 'vendeur',
            'shop_id' => $shop->id,
            'tenant_id' => $tenant->id,
        ]
    );
    echo "Vendeur: {$vendeur->email} / password\n";

    echo "\n=== DONE ===\n";
    echo "Delete this file now!\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
echo "</pre>";
