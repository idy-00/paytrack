<?php
/**
 * PayTrack Demo Data Seeder
 * Upload to public_html/backend/public/ and run via browser
 * DELETE THIS FILE AFTER USE!
 */

$secret = 'paytrack2026seed';
if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    die('Access denied. Use ?key=' . $secret);
}

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;
use App\Models\Shop;
use App\Models\User;
use App\Models\Client;
use App\Models\Article;
use Illuminate\Support\Facades\Hash;

echo "<pre>";
echo "=== PayTrack Demo Data Seeder ===\n\n";

try {
    // Create Tenant
    $tenant = Tenant::firstOrCreate(
        ['name' => 'PhoneShop Dakar'],
        [
            'slug' => 'phoneshop-dakar',
            'settings' => json_encode(['currency' => 'XOF', 'timezone' => 'Africa/Dakar']),
        ]
    );
    echo "✓ Tenant created: {$tenant->name} (ID: {$tenant->id})\n";

    // Create Shop
    $shop = Shop::firstOrCreate(
        ['tenant_id' => $tenant->id, 'name' => 'Boutique Principale'],
        [
            'address' => 'Medina, Dakar',
            'phone' => '+221771234567',
            'is_active' => true,
        ]
    );
    echo "✓ Shop created: {$shop->name} (ID: {$shop->id})\n";

    // Create Admin User
    $admin = User::firstOrCreate(
        ['email' => 'moussa@phoneshop-dakar.com'],
        [
            'name' => 'Moussa Diop',
            'password' => Hash::make('demo1234'),
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'phone' => '+221771234567',
            'is_active' => true,
        ]
    );
    $admin->assignRole('admin_entreprise');
    echo "✓ Admin created: {$admin->email}\n";

    // Create Responsable
    $responsable = User::firstOrCreate(
        ['email' => 'fatou@phoneshop-dakar.com'],
        [
            'name' => 'Fatou Sall',
            'password' => Hash::make('demo1234'),
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'phone' => '+221772345678',
            'is_active' => true,
        ]
    );
    $responsable->assignRole('responsable_boutique');
    echo "✓ Responsable created: {$responsable->email}\n";

    // Create Vendeur
    $vendeur = User::firstOrCreate(
        ['email' => 'omar@phoneshop-dakar.com'],
        [
            'name' => 'Omar Ndiaye',
            'password' => Hash::make('demo1234'),
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'phone' => '+221773456789',
            'is_active' => true,
        ]
    );
    $vendeur->assignRole('vendeur');
    echo "✓ Vendeur created: {$vendeur->email}\n";

    // Create Clients
    $clients = [
        ['name' => 'Aminata Ndiaye', 'phone' => '+221774567890', 'email' => 'aminata@gmail.com'],
        ['name' => 'Ibrahima Fall', 'phone' => '+221775678901', 'email' => 'ibrahima@gmail.com'],
        ['name' => 'Mariama Diallo', 'phone' => '+221776789012', 'email' => 'mariama@gmail.com'],
    ];

    foreach ($clients as $c) {
        $client = Client::firstOrCreate(
            ['phone' => $c['phone'], 'tenant_id' => $tenant->id],
            [
                'full_name' => $c['name'],
                'email' => $c['email'],
                'address' => 'Dakar, Sénégal',
            ]
        );
        echo "✓ Client created: {$client->full_name}\n";
    }

    // Create Articles
    $articles = [
        ['name' => 'iPhone 15 Pro Max', 'price' => 850000, 'stock' => 5],
        ['name' => 'Samsung Galaxy S24 Ultra', 'price' => 750000, 'stock' => 8],
        ['name' => 'iPhone 14', 'price' => 550000, 'stock' => 10],
        ['name' => 'Samsung Galaxy A54', 'price' => 280000, 'stock' => 15],
        ['name' => 'Tecno Camon 20', 'price' => 150000, 'stock' => 20],
    ];

    foreach ($articles as $a) {
        $article = Article::firstOrCreate(
            ['name' => $a['name'], 'tenant_id' => $tenant->id],
            [
                'shop_id' => $shop->id,
                'description' => 'Smartphone ' . $a['name'],
                'unit_price' => $a['price'],
                'stock_quantity' => $a['stock'],
                'is_active' => true,
            ]
        );
        echo "✓ Article created: {$article->name} - " . number_format($article->unit_price) . " XOF\n";
    }

    echo "\n=== DONE! ===\n";
    echo "\n📧 Comptes de test:\n";
    echo "   Admin: moussa@phoneshop-dakar.com / demo1234\n";
    echo "   Responsable: fatou@phoneshop-dakar.com / demo1234\n";
    echo "   Vendeur: omar@phoneshop-dakar.com / demo1234\n";
    echo "\n⚠️  DELETE THIS FILE NOW! (seed-demo.php)\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}

echo "</pre>";
