<?php

use App\Models\DexpayWebhook;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\Wallet;
use App\Models\WalletTransaction;
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
    'name' => 'Audit Cash In ' . $suffix,
    'slug' => 'audit-cash-in-' . $suffix,
    'country' => 'SN',
    'currency' => 'XOF',
    'created_at' => $now,
    'updated_at' => $now,
]);
$userId = DB::table('users')->insertGetId([
    'tenant_id' => $tenantId,
    'name' => 'Audit Worker',
    'email' => 'audit-' . $suffix . '@example.test',
    'password' => 'not-used-by-test',
    'created_at' => $now,
    'updated_at' => $now,
]);
$clientId = DB::table('clients')->insertGetId([
    'tenant_id' => $tenantId,
    'full_name' => 'Client Audit',
    'phone' => '770000000',
    'created_at' => $now,
    'updated_at' => $now,
]);
$walletId = DB::table('wallets')->insertGetId([
    'tenant_id' => $tenantId,
    'created_at' => $now,
    'updated_at' => $now,
]);
$orderId = DB::table('orders')->insertGetId([
    'tenant_id' => $tenantId,
    'client_id' => $clientId,
    'created_by' => $userId,
    'reference' => 'CMD-AUDIT-' . $suffix,
    'qr_uuid' => (string) Str::uuid(),
    'subtotal' => 10_000,
    'total_amount' => 10_000,
    'remaining_amount' => 10_000,
    'order_date' => $now->toDateString(),
    'created_at' => $now,
    'updated_at' => $now,
]);

$transactionId = 'audit-cashin-' . $suffix;
$payload = [
    'event' => 'checkout.completed',
    'data' => [
        'transaction_id' => $transactionId,
        'checkout_session_id' => 'checkout-' . $suffix,
        'reference' => 'ORD-' . $orderId . '-' . now()->timestamp,
        'amount' => 10_000,
        'currency' => 'XOF',
        'status' => 'completed',
        'operator' => 'wave',
        'external_transaction_id' => 'wave-' . $suffix,
        'fee_amount' => 150,
    ],
];
$secret = 'audit-concurrency-secret';
$payloadJson = json_encode($payload, JSON_THROW_ON_ERROR);
$signature = hash_hmac('sha256', $payloadJson, $secret);
$barrierId = 'barrier-' . $suffix;

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
    $processes[$workerId] = proc_open($command, $descriptors, $pipes, base_path(), $workerEnvironment);
    if (!is_resource($processes[$workerId])) {
        throw new RuntimeException("Could not start {$workerId}.");
    }
    fclose($pipes[0]);
    $processes[$workerId] = [$processes[$workerId], $pipes];
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

$wallet = Wallet::findOrFail($walletId);
$proof = [
    'workers' => $workers,
    'transaction_id' => $transactionId,
    'webhook_rows' => DexpayWebhook::where('transaction_id', $transactionId)->count(),
    'order_payment_rows' => OrderPayment::where('dexpay_transaction_id', $transactionId)->count(),
    'wallet_credit_rows' => WalletTransaction::where('dexpay_transaction_id', $transactionId)->count(),
    'wallet_balance' => $wallet->balance,
    'wallet_total_credits' => $wallet->total_credits,
    'order' => Order::findOrFail($orderId)->only(['paid_amount', 'remaining_amount', 'payment_status']),
];

echo json_encode($proof, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;

if (
    $proof['webhook_rows'] !== 1 ||
    $proof['order_payment_rows'] !== 1 ||
    $proof['wallet_credit_rows'] !== 1 ||
    $proof['wallet_balance'] !== 9_850 ||
    $proof['wallet_total_credits'] !== 9_850 ||
    $proof['order']['paid_amount'] !== 10_000 ||
    $proof['order']['remaining_amount'] !== 0 ||
    $proof['order']['payment_status'] !== 'paid' ||
    array_filter($workers, fn (array $worker) => $worker['exit_code'] !== 0) !== []
) {
    exit(1);
}
