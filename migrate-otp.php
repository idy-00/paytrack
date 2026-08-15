<?php
$secret = 'paytrack2026otp';
if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    die('Access denied.');
}

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<pre>";
echo "=== PayTrack OTP Migration ===\n\n";

$result = $kernel->call('migrate', ['--force' => true]);
echo $kernel->output();

echo "\n=== DONE! ===\n";
echo "\n⚠️ DELETE THIS FILE NOW!\n";
echo "</pre>";
