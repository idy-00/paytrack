<?php
$secret = 'paytrack2026check';
if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    die('Access denied.');
}

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use App\Models\Shop;
use App\Models\Client;
use App\Models\Article;
use Illuminate\Support\Facades\Hash;

echo "<pre>";
echo "=== PayTrack Database Check ===\n\n";

// Check tenants
$tenants = Tenant::all();
echo "TENANTS (" . $tenants->count() . "):\n";
foreach ($tenants as $t) {
    echo "  - {$t->name} (ID: {$t->id})\n";
}

// Check shops
$shops = Shop::all();
echo "\nSHOPS (" . $shops->count() . "):\n";
foreach ($shops as $s) {
    echo "  - {$s->name} (ID: {$s->id})\n";
}

// Check users
$users = User::all();
echo "\nUSERS (" . $users->count() . "):\n";
foreach ($users as $u) {
    $roles = $u->getRoleNames()->implode(', ') ?: 'no role';
    echo "  - {$u->email} ({$roles})\n";
}

// Check clients
$clients = Client::all();
echo "\nCLIENTS (" . $clients->count() . "):\n";
foreach ($clients as $c) {
    echo "  - {$c->full_name} - {$c->phone}\n";
}

// Check articles
$articles = Article::all();
echo "\nARTICLES (" . $articles->count() . "):\n";
foreach ($articles as $a) {
    echo "  - {$a->name} - " . number_format($a->unit_price) . " XOF (stock: {$a->stock_quantity})\n";
}

// If no users, create them
if ($users->count() == 0) {
    echo "\n--- Creating demo users ---\n";

    $tenant = Tenant::first();
    if (!$tenant) {
        $tenant = Tenant::create([
            'name' => 'PhoneShop Dakar',
            'slug' => 'phoneshop-dakar-' . time(),
            'settings' => json_encode(['currency' => 'XOF']),
        ]);
    }

    $shop = Shop::first();
    if (!$shop) {
        $shop = Shop::create([
            'tenant_id' => $tenant->id,
            'name' => 'Boutique Principale',
            'address' => 'Dakar',
            'is_active' => true,
        ]);
    }

    $admin = User::create([
        'name' => 'Moussa Diop',
        'email' => 'moussa@phoneshop-dakar.com',
        'password' => Hash::make('demo1234'),
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'is_active' => true,
    ]);
    $admin->assignRole('admin_entreprise');
    echo "  Created: moussa@phoneshop-dakar.com\n";
}

echo "\n=== API Test URL ===\n";
echo "https://lightsalmon-eel-638395.hostingersite.com/api/auth/login\n";
echo "POST: {\"email\": \"moussa@phoneshop-dakar.com\", \"password\": \"demo1234\"}\n";

echo "\n⚠️  DELETE THIS FILE NOW!\n";
echo "</pre>";
