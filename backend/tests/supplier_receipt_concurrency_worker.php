<?php
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$barrierId = getenv('PAYTRACK_AUDIT_BARRIER_ID');
DB::table('audit_concurrency_barrier')->insert(['barrier_id' => $barrierId, 'worker_id' => getenv('PAYTRACK_AUDIT_WORKER_ID')]);
$deadline = microtime(true) + 15;
while (DB::table('audit_concurrency_barrier')->where('barrier_id', $barrierId)->count() < 2) {
    if (microtime(true) >= $deadline) throw new RuntimeException('Second supplier worker did not reach the barrier.');
    usleep(10_000);
}
$request = Request::create(getenv('PAYTRACK_AUDIT_URL'), 'POST', json_decode(getenv('PAYTRACK_AUDIT_PAYLOAD'), true, 512, JSON_THROW_ON_ERROR), [], [], [
    'HTTP_AUTHORIZATION' => 'Bearer ' . getenv('PAYTRACK_AUDIT_TOKEN'), 'HTTP_ACCEPT' => 'application/json', 'REMOTE_ADDR' => '127.0.0.1',
]);
$kernel = $app->make(Kernel::class);
$response = $kernel->handle($request);
$kernel->terminate($request, $response);
echo json_encode(['status' => $response->getStatusCode(), 'body' => json_decode($response->getContent(), true)], JSON_THROW_ON_ERROR) . PHP_EOL;
