<?php
if (!isset($_GET['key']) || $_GET['key'] !== 'paytrack2026') die('No');

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$newHash = Hash::make($_GET['pw'] ?? 'demo1234');

DB::table('users')->update(['password' => $newHash]);

echo "Done. All users pw reset.\n";
echo "DELETE THIS FILE NOW!";
