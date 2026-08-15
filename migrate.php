<?php
/**
 * PayTrack Migration Script
 * Upload to public_html/backend/public/ and run via browser
 * DELETE THIS FILE AFTER USE!
 */

// Security check - delete after use
$secret = 'paytrack2026migrate';
if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    die('Access denied. Use ?key=' . $secret);
}

// Change to Laravel root
chdir(__DIR__ . '/..');

// Load Laravel
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<pre>";
echo "=== PayTrack Database Migration ===\n\n";

// Run migrations
echo "Running migrations...\n";
$result = $kernel->call('migrate', ['--force' => true]);
echo $kernel->output();

echo "\n--- Running seeders ---\n";
$result = $kernel->call('db:seed', ['--force' => true]);
echo $kernel->output();

echo "\n=== DONE! ===\n";
echo "\n⚠️  DELETE THIS FILE NOW! (migrate.php)\n";
echo "</pre>";
