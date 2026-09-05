<?php

use App\Models\Article;
use App\Models\Client;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (config('database.default') !== 'mysql' || getenv('PAYTRACK_CONCURRENCY_ALLOW_HOSTINGER') !== 'true') {
    throw new RuntimeException('Safety stop: explicit PAYTRACK_CONCURRENCY_ALLOW_HOSTINGER=true is required.');
}
$database = (string) config('database.connections.mysql.database');

$suffix = Str::lower((string) Str::ulid());
Role::firstOrCreate(['name' => 'vendeur', 'guard_name' => 'web']);
$tenant = Tenant::create(['name' => 'Audit Stock ' . $suffix, 'slug' => 'audit-stock-' . $suffix]);
app()->instance('current_tenant_id', $tenant->id);
$shop = Shop::forceCreate(['tenant_id' => $tenant->id, 'name' => 'Boutique audit stock']);
$user = User::forceCreate([
    'tenant_id' => $tenant->id,
    'shop_id' => $shop->id,
    'name' => 'Vendeur audit',
    'email' => 'seller-' . $suffix . '@example.test',
    'password' => 'not-used-by-test',
    'is_active' => true,
]);
$user->assignRole('vendeur');
$client = Client::forceCreate([
    'tenant_id' => $tenant->id,
    'shop_id' => $shop->id,
    'full_name' => 'Client audit stock',
    'phone' => '+221770000000',
]);
$article = Article::forceCreate([
    'tenant_id' => $tenant->id,
    'name' => 'Article audit stock',
    'price' => 1_000,
    'stock' => 5,
    'is_active' => true,
]);
$token = $user->createToken('audit-stock-concurrency')->plainTextToken;
$payload = [
    'client_id' => $client->id,
    'article_id' => $article->id,
    'article_name' => $article->name,
    'quantity' => 3,
    'total_amount' => 3_000,
    'down_payment' => 3_000,
    'payment_mode' => 'comptant',
    'installment_count' => 1,
    'frequency' => 'mensuel',
    'start_date' => today()->toDateString(),
];
$barrierId = 'sale-barrier-' . $suffix;
$environment = [
    'APP_ENV' => 'testing',
    'CACHE_STORE' => 'array',
    'SESSION_DRIVER' => 'array',
    'QUEUE_CONNECTION' => 'sync',
    'DB_CONNECTION' => 'mysql',
    'DB_HOST' => (string) config('database.connections.mysql.host'),
    'DB_PORT' => (string) config('database.connections.mysql.port'),
    'DB_DATABASE' => $database,
    'DB_USERNAME' => (string) config('database.connections.mysql.username'),
    'DB_PASSWORD' => (string) config('database.connections.mysql.password'),
    'PAYTRACK_AUDIT_PAYLOAD' => json_encode($payload, JSON_THROW_ON_ERROR),
    'PAYTRACK_AUDIT_TOKEN' => $token,
    'PAYTRACK_AUDIT_BARRIER_ID' => $barrierId,
];

DB::statement('DROP TABLE IF EXISTS audit_concurrency_barrier');
DB::statement('CREATE TABLE audit_concurrency_barrier (barrier_id varchar(255) not null, worker_id varchar(255) not null, primary key (barrier_id, worker_id))');
$command = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/sale_stock_concurrency_worker.php');
$descriptors = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
$processes = [];
foreach (['worker-a', 'worker-b'] as $workerId) {
    $workerEnvironment = $environment + ['PAYTRACK_AUDIT_WORKER_ID' => $workerId];
    $process = proc_open($command, $descriptors, $pipes, base_path(), $workerEnvironment);
    if (!is_resource($process)) {
        throw new RuntimeException("Could not start {$workerId}.");
    }
    fclose($pipes[0]);
    $processes[$workerId] = [$process, $pipes];
}

$workers = [];
foreach ($processes as $workerId => [$process, $pipes]) {
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $workers[$workerId] = [
        'exit_code' => proc_close($process),
        'stdout' => trim($stdout),
        'stderr' => trim($stderr),
    ];
}

$statuses = array_map(fn (array $worker) => json_decode($worker['stdout'], true)['status'] ?? null, $workers);
sort($statuses);
$proof = [
    'workers' => $workers,
    'http_statuses' => $statuses,
    'article_stock' => $article->fresh()->stock,
    'sales_for_article' => DB::table('sales')->where('article_id', $article->id)->count(),
];
echo json_encode($proof, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;

if (
    $statuses !== [201, 422] ||
    $proof['article_stock'] !== 2 ||
    $proof['sales_for_article'] !== 1 ||
    array_filter($workers, fn (array $worker) => $worker['exit_code'] !== 0) !== []
) {
    exit(1);
}
