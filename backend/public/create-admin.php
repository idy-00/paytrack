<?php
if (!isset($_GET['key']) || $_GET['key'] !== 'paytrack2026') die('No');

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "<pre>";
echo "=== Create Admin User ===\n\n";

try {
    $user = User::updateOrCreate(
        ['email' => 'admin@paytrack.com'],
        [
            'name' => 'Admin PayTrack',
            'phone' => '+221770000001',
            'tenant_id' => 1,
            'shop_id' => 1,
            'password' => Hash::make('admin2024'),
            'is_active' => true,
        ]
    );

    $user->syncRoles(['admin_entreprise']);

    echo "User created/updated:\n";
    echo "Email: admin@paytrack.com\n";
    echo "Password: admin2024\n";
    echo "Role: admin_entreprise\n";
    echo "\n=== DONE - DELETE THIS FILE ===\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
echo "</pre>";
