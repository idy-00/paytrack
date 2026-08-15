<?php
$secret = 'paytrack2026role';
if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    die('Access denied.');
}

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "<pre>";
echo "=== User Roles Check ===\n\n";

$users = User::all();
foreach ($users as $user) {
    $roles = $user->getRoleNames()->toArray();
    $firstRole = $roles[0] ?? 'NO ROLE';
    echo "{$user->email}\n";
    echo "  - Spatie roles: " . json_encode($roles) . "\n";
    echo "  - First role: {$firstRole}\n";
    echo "  - Will return in API: {$firstRole}\n\n";
}

echo "\n⚠️ DELETE THIS FILE!\n";
echo "</pre>";
