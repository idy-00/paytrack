<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Services\DexpayService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (config('services.dexpay.mode') !== 'test') {
    fwrite(STDERR, "Refus: ce script ne fonctionne qu'en mode DexPay test.\n");
    exit(2);
}

$suffix = now()->format('YmdHis');

DB::transaction(function () use ($suffix, &$withdrawal) {
    $tenant = Tenant::create([
        'name' => "Audit retrait sandbox {$suffix}",
        'slug' => "audit-retrait-{$suffix}",
        'is_active' => true,
        'kyc_status' => 'approved',
        'kyc_approved_at' => now(),
    ]);
    $user = User::create([
        'name' => 'Audit sandbox',
        'email' => "audit-withdrawal-{$suffix}@example.invalid",
        'password' => str()->random(40),
        'tenant_id' => $tenant->id,
        'is_active' => true,
    ]);
    $wallet = $tenant->getOrCreateWallet();
    $wallet->update(['balance' => 20_000]);

    $withdrawal = WithdrawalRequest::create([
        'tenant_id' => $tenant->id,
        'wallet_id' => $wallet->id,
        'requested_by' => $user->id,
        'amount' => 10_000,
        'payout_method' => 'wave',
        'payout_account' => '+221770000000',
        'status' => 'pending',
    ]);
});

$result = $withdrawal->initiateCashOut();
$withdrawal->refresh();
$withdrawal->wallet->refresh();
$payout = !empty($result['transactionId'])
    ? app(DexpayService::class)->getPayout($result['transactionId'])
    : null;

echo json_encode([
    'result' => $result,
    'request_amount' => $withdrawal->amount,
    'recorded_fee' => $withdrawal->fees,
    'recipient_net' => $withdrawal->net_amount,
    'wallet_debit' => $withdrawal->walletDebitAmount(),
    'wallet_balance_after' => $withdrawal->wallet->balance,
    'status' => $withdrawal->status,
    'reference' => $withdrawal->dexpay_reference,
    'dexpay_payout' => $payout['data'] ?? $payout,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
