<?php
if (!isset($_GET['key']) || $_GET['key'] !== 'paytrack2026') die('No');

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<pre>";
echo "Clearing cache...\n\n";

$kernel->call('config:clear');
echo "config:clear done\n";

$kernel->call('cache:clear');
echo "cache:clear done\n";

$kernel->call('route:clear');
echo "route:clear done\n";

$kernel->call('view:clear');
echo "view:clear done\n";

echo "\n=== DONE ===\n";
echo "</pre>";
