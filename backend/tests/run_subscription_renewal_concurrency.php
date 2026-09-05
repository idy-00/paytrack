<?php

use App\Models\DexpayWebhook;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (config('database.default') !== 'mysql' || getenv('PAYTRACK_CONCURRENCY_ALLOW_HOSTINGER') !== 'true') {
    throw new RuntimeException('Safety stop: explicit PAYTRACK_CONCURRENCY_ALLOW_HOSTINGER=true is required.');
}
$database = (string) config('database.connections.mysql.database');

$now = now();
$suffix = Str::lower((string) Str::ulid());
$tenantId = DB::table('tenants')->insertGetId([
    'name' => 'Audit Subscription ' . $suffix,
    'slug' => 'audit-subscription-' . $suffix,
    'country' => 'SN',
    'currency' => 'XOF',
    'created_at' => $now,
    'updated_at' => $now,
]);
$planId = DB::table('subscription_plans')->insertGetId([
    'name' => 'Audit monthly',
    'slug' => 'audit-monthly-' . $suffix,
    'price_monthly' => 1_000,
    'price_yearly' => 10_000,
    'max_users' => 1,
    'created_at' => $now,
    'updated_at' => $now,
]);
$originalEnd = $now->copy()->addMonth();
$subscriptionId = DB::table('subscriptions')->insertGetId([
    'tenant_id' => $tenantId,
    'plan_id' => $planId,
    'billing_cycle' => 'monthly',
    'status' => 'active',
    'current_period_start' => $now,
    'current_period_end' => $originalEnd,
    'created_at' => $now,
    'updated_at' => $now,
]);

$transactionId = 'audit-subscription-' . $suffix;
$payload = [
    'event' => 'subscription.payment.succeeded',
    'data' => [
        'transaction_id' => $transactionId,
        'reference' => 'SUB-' . $subscriptionId . '-' . now()->timestamp,
        'amount' => 1_000,
        'currency' => 'XOF',
        'operator' => 'wave',
        'external_transaction_id' => 'wave-sub-' . $suffix,
    ],
];
$secret = 'audit-concurrency-secret';
$payloadJson = json_encode($payload, JSON_THROW_ON_ERROR);
$signature = hash_hmac('sha256', $payloadJson, $secret);
$barrierId = 'subscription-barrier-' . $suffix;
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
    'PAYTRACK_AUDIT_PAYLOAD' => $payloadJson,
    'PAYTRACK_AUDIT_SIGNATURE' => $signature,
    'PAYTRACK_AUDIT_WEBHOOK_SECRET' => $secret,
    'PAYTRACK_AUDIT_BARRIER_ID' => $barrierId,
];

DB::statement('DROP TABLE IF EXISTS audit_concurrency_barrier');
DB::statement('CREATE TABLE audit_concurrency_barrier (barrier_id varchar(255) not null, worker_id varchar(255) not null, primary key (barrier_id, worker_id))');
$command = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/webhook_concurrency_worker.php');
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

$subscription = Subscription::findOrFail($subscriptionId);
$proof = [
    'workers' => $workers,
    'webhook_rows' => DexpayWebhook::where('transaction_id', $transactionId)->count(),
    'subscription_payment_rows' => SubscriptionPayment::where('transaction_id', $transactionId)->count(),
    'subscription_status' => $subscription->status,
    'period_end' => $subscription->current_period_end?->toDateTimeString(),
    'expected_period_end' => $originalEnd->copy()->addMonth()->toDateTimeString(),
];
echo json_encode($proof, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;

if (
    $proof['webhook_rows'] !== 1 ||
    $proof['subscription_payment_rows'] !== 1 ||
    $proof['subscription_status'] !== 'active' ||
    $proof['period_end'] !== $proof['expected_period_end'] ||
    array_filter($workers, fn (array $worker) => $worker['exit_code'] !== 0) !== []
) {
    exit(1);
}
