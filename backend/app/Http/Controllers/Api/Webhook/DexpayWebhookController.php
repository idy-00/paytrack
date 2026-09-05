<?php

namespace App\Http\Controllers\Api\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\DexpayWebhook;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\SaleSchedule;
use App\Models\Subscription;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use App\Services\DexpayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DexpayWebhookController extends Controller
{
    public function __construct(
        private DexpayService $dexpay
    ) {}

    public function handle(Request $request)
    {
        $rawBody = $request->getContent();
        $payload = $request->all();
        $signature = $request->header('x-webhook-signature', '');
        $ip = $request->ip();

        // Logger le webhook
        $webhook = $this->dexpay->logWebhook($payload, $rawBody, $signature, $ip);

        // Vérifier la signature
        if (!$webhook->signature_valid) {
            Log::warning('DexPay webhook invalid signature', [
                'ip' => $ip,
                'event' => $payload['event'] ?? 'unknown',
            ]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // Extraire les infos
        $info = $this->dexpay->extractPaymentInfo($payload);
        $event = $info['event'];
        $reference = $info['reference'];
        $transactionId = $info['transaction_id'];

        try {
            DB::beginTransaction();
            $webhook = DexpayWebhook::lockForUpdate()->findOrFail($webhook->id);
            if ($transactionId && $webhook->processing_status === 'processed') {
                DB::commit();
                Log::info('DexPay webhook already processed', ['transaction_id' => $transactionId]);
                return response()->json(['status' => 'already_processed']);
            }

            switch ($event) {
                case 'checkout.completed':
                    $this->handleCheckoutCompleted($info, $webhook);
                    break;

                case 'checkout.failed':
                    $this->handleCheckoutFailed($info, $webhook);
                    break;

                case 'checkout.cancelled':
                    $this->handleCheckoutCancelled($info, $webhook);
                    break;

                case 'checkout.refunded':
                    $this->handleCheckoutRefunded($info, $webhook);
                    break;

                case 'subscription.activated':
                    $this->handleSubscriptionActivated($info, $webhook);
                    break;

                case 'subscription.payment.succeeded':
                    $this->handleSubscriptionPaymentSucceeded($info, $webhook);
                    break;

                case 'subscription.payment.failed':
                    $this->handleSubscriptionPaymentFailed($info, $webhook);
                    break;

                case 'subscription.cancelled':
                    $this->handleSubscriptionCancelled($info, $webhook);
                    break;

                case 'payout.completed':
                    $this->handlePayoutCompleted($info, $webhook);
                    break;

                case 'payout.failed':
                    $this->handlePayoutFailed($info, $webhook);
                    break;

                case 'chargeback.created':
                case 'chargeback.won':
                case 'chargeback.lost':
                    $this->handleChargeback($info, $webhook);
                    break;

                case 'funds.released':
                    $this->handleFundsReleased($info, $webhook);
                    break;

                default:
                    Log::info('DexPay webhook unhandled event', ['event' => $event]);
                    $webhook->markAsProcessed("Unhandled event: {$event}");
            }

            DB::commit();
            return response()->json(['status' => 'ok']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('DexPay webhook processing error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $webhook->markAsFailed($e->getMessage());
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    private function handleCheckoutCompleted(array $info, $webhook): void
    {
        $reference = $info['reference'];
        $amount = $info['amount'];
        $operator = $info['operator'];
        $externalTxId = $info['external_transaction_id'];

        // Déterminer le type de paiement par le préfixe de référence
        if (str_starts_with($reference, 'SUB-')) {
            // Paiement d'abonnement
            $this->processSubscriptionPayment($reference, $amount, $info);
        } elseif (str_starts_with($reference, 'ORD-')) {
            // Paiement de commande
            $this->processOrderPayment($reference, $amount, $info);
        } elseif (str_starts_with($reference, 'PAY-')) {
            // Paiement direct (vente à crédit)
            $this->processDirectPayment($reference, $amount, $info);
        } else {
            Log::warning('DexPay unknown reference format', ['reference' => $reference]);
        }

        $webhook->markAsProcessed("Checkout completed: {$reference}, amount: {$amount}, operator: {$operator}");
    }

    private function handleCheckoutFailed(array $info, $webhook): void
    {
        $reference = $info['reference'];
        $reason = $info['failure_reason'] ?? 'Unknown';

        Log::info('DexPay checkout failed', [
            'reference' => $reference,
            'reason' => $reason,
        ]);

        $webhook->markAsProcessed("Checkout failed: {$reference}, reason: {$reason}");
    }

    private function handleCheckoutCancelled(array $info, $webhook): void
    {
        $reference = $info['reference'];

        Log::info('DexPay checkout cancelled', ['reference' => $reference]);

        $webhook->markAsProcessed("Checkout cancelled: {$reference}");
    }

    private function handleCheckoutRefunded(array $info, $webhook): void
    {
        $reference = $info['reference'];
        $refundAmount = $info['amount'];

        Log::info('DexPay checkout refunded', [
            'reference' => $reference,
            'amount' => $refundAmount,
        ]);

        $webhook->markAsProcessed("Checkout refunded: {$reference}, amount: {$refundAmount}");
    }

    private function handleSubscriptionActivated(array $info, $webhook): void
    {
        // Géré via checkout.completed avec préfixe SUB-
        $webhook->markAsProcessed("Subscription activated");
    }

    private function handleSubscriptionPaymentSucceeded(array $info, $webhook): void
    {
        $this->processSubscriptionPayment(
            (string) ($info['reference'] ?? ''),
            (int) ($info['amount'] ?? 0),
            $info,
            true
        );
        $webhook->markAsProcessed("Subscription payment succeeded: {$info['reference']}");
    }

    private function handleSubscriptionPaymentFailed(array $info, $webhook): void
    {
        $webhook->markAsProcessed("Subscription payment failed");
    }

    private function handleSubscriptionCancelled(array $info, $webhook): void
    {
        $webhook->markAsProcessed("Subscription cancelled");
    }

    private function processSubscriptionPayment(string $reference, int $amount, array $info, bool $isRenewal = false): void
    {
        // Format: SUB-{subscription_id}-{timestamp}
        $parts = explode('-', $reference);
        if (count($parts) < 2) return;

        $subscriptionId = $parts[1];
        $subscription = Subscription::lockForUpdate()->find($subscriptionId);

        if (!$subscription) {
            Log::warning('DexPay subscription not found', ['reference' => $reference]);
            return;
        }

        $transactionId = (string) ($info['transaction_id'] ?? '');
        if ($transactionId === '' || $subscription->payments()->where('transaction_id', $transactionId)->exists()) {
            return;
        }

        $isRenewal ? $subscription->renew() : $subscription->activate();

        // Enregistrer le paiement
        $subscription->payments()->create([
            'amount' => $amount,
            'payment_method' => 'dexpay',
            'payment_provider' => $info['operator'] ?? 'dexpay',
            'transaction_id' => $transactionId,
            'external_transaction_id' => $info['external_transaction_id'],
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        Log::info('DexPay subscription payment processed', [
            'subscription_id' => $subscriptionId,
            'amount' => $amount,
        ]);
    }

    private function processOrderPayment(string $reference, int $amount, array $info): void
    {
        // Format: ORD-{order_id}-{timestamp}
        $parts = explode('-', $reference);
        if (count($parts) < 2) return;

        $orderId = $parts[1];
        $order = Order::find($orderId);

        if (!$order) {
            Log::warning('DexPay order not found', ['reference' => $reference]);
            return;
        }

        $transactionId = (string) ($info['transaction_id'] ?? '');
        if ($transactionId === '' || OrderPayment::where('dexpay_transaction_id', $transactionId)->exists()) {
            return;
        }

        $payableAmount = min($amount, $order->remaining_amount);
        if ($payableAmount <= 0) return;

        OrderPayment::create([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'recorded_by' => null,
            'amount' => $payableAmount,
            'payment_date' => now(),
            'payment_method' => $this->mapOrderPaymentMethod($info['operator'] ?? null),
            'dexpay_transaction_id' => $transactionId,
            'source' => 'dexpay',
            'notes' => 'Paiement en ligne DexPay',
        ]);

        // Créditer le wallet du marchand
        $tenant = $order->tenant;
        if ($tenant && $tenant->wallet) {
            $netAmount = $this->merchantNetFromDexpay($info, $amount);
            $operator = strtolower($info['operator'] ?? '');
            $transactionId = $info['transaction_id'];

            // Distinguer carte vs mobile money
            $isCardPayment = $this->isCardPayment($operator);

            if ($isCardPayment) {
                // Vérifier si les paiements carte sont activés
                if (!$this->isCardPaymentEnabled()) {
                    Log::warning('DexPay card payment received but card payments disabled', [
                        'order_id' => $orderId,
                        'amount' => $netAmount,
                        'operator' => $operator,
                    ]);
                    // Traiter comme mobile money (crédit immédiat) en fallback
                    // pour ne pas bloquer le paiement du client
                    $tenant->wallet->credit(
                        $netAmount,
                        "Paiement commande #{$order->id} (carte - fallback)",
                        $order,
                        $transactionId,
                        'card_fallback'
                    );
                    return;
                }

                // Paiement carte : fonds retenus (72h puis 7j)
                $tenant->wallet->creditHeld(
                    $netAmount,
                    "Paiement carte commande #{$order->id}",
                    $order,
                    $transactionId
                );

                Log::info('DexPay card payment - funds held', [
                    'order_id' => $orderId,
                    'amount' => $netAmount,
                    'release_after' => '72h partial, 7j full',
                ]);
            } else {
                // Paiement mobile money : crédit immédiat
                $tenant->wallet->credit(
                    $netAmount,
                    "Paiement commande #{$order->id}",
                    $order,
                    $transactionId,
                    $operator ?: 'mobile_money'
                );
            }
        }

        Log::info('DexPay order payment processed', [
            'order_id' => $orderId,
            'amount' => $amount,
            'operator' => $info['operator'] ?? 'unknown',
        ]);
    }

    /**
     * Détermine si le paiement est par carte
     */
    private function isCardPayment(?string $operator): bool
    {
        if (!$operator) return false;

        $cardOperators = ['card', 'visa', 'mastercard', 'cb', 'credit_card', 'debit_card'];
        return in_array(strtolower($operator), $cardOperators)
            || str_contains(strtolower($operator), 'card');
    }

    private function mapOrderPaymentMethod(?string $operator): string
    {
        $value = strtolower($operator ?? '');
        if (str_contains($value, 'wave')) return 'wave';
        if (str_contains($value, 'orange')) return 'orange_money';
        if (str_contains($value, 'free')) return 'free_money';
        return 'card';
    }

    private function merchantNetFromDexpay(array $info, int $grossAmount): int
    {
        if (is_numeric($info['merchant_net'] ?? null)) {
            return max(0, (int) $info['merchant_net']);
        }
        if (is_numeric($info['fee_amount'] ?? null)) {
            return max(0, $grossAmount - (int) $info['fee_amount']);
        }
        throw new \RuntimeException('Webhook DexPay sans frais/net : crédit wallet refusé pour éviter un crédit brut erroné.');
    }

    /**
     * Vérifie si les paiements carte sont activés
     */
    private function isCardPaymentEnabled(): bool
    {
        return config('services.dexpay.card_enabled', false);
    }

    private function processDirectPayment(string $reference, int $amount, array $info): void
    {
        // Format: PAY-{sale_id}-{timestamp}. Le webhook, et non le navigateur,
        // est la seule source de vérité pour créditer une échéance.
        $parts = explode('-', $reference);
        $saleId = $parts[1] ?? null;
        if (!ctype_digit((string) $saleId)) {
            Log::warning('DexPay direct payment invalid reference', ['reference' => $reference]);
            return;
        }

        $sale = Sale::lockForUpdate()->with(['client', 'schedules'])->find($saleId);
        if (!$sale || in_array($sale->status, ['solde', 'annule'], true)) {
            Log::warning('DexPay direct payment sale unavailable', ['sale_id' => $saleId]);
            return;
        }

        $payableAmount = min((int) $amount, (int) $sale->remaining_amount);
        if ($payableAmount <= 0) return;

        $schedule = $sale->schedules
            ->first(fn (SaleSchedule $item) => $item->status !== 'paye');
        $payment = Payment::create([
            'tenant_id' => $sale->tenant_id,
            'sale_id' => $sale->id,
            'sale_schedule_id' => $schedule?->id,
            'recorded_by' => null,
            'receipt_number' => 'DX-' . strtoupper(substr((string) ($info['transaction_id'] ?? $reference), -12)),
            'amount' => $payableAmount,
            'payment_date' => now(),
            'payment_method' => $this->mapOrderPaymentMethod($info['operator'] ?? null),
            'payment_type' => $payableAmount >= $sale->remaining_amount ? 'solde' : 'tranche',
            'notes' => 'Paiement client confirmé par webhook DexPay',
        ]);

        $remaining = max(0, $sale->remaining_amount - $payableAmount);
        $sale->update([
            'paid_amount' => $sale->paid_amount + $payableAmount,
            'remaining_amount' => $remaining,
            'status' => $remaining === 0 ? 'solde' : $sale->status,
        ]);
        if ($schedule && $payableAmount >= $schedule->amount) {
            $schedule->update(['status' => 'paye', 'paid_date' => now(), 'paid_amount' => $schedule->amount]);
        }

        Log::info('DexPay direct payment processed', [
            'reference' => $reference,
            'payment_id' => $payment->id,
            'amount' => $payableAmount,
        ]);
    }

    private function handlePayoutCompleted(array $info, $webhook): void
    {
        $reference = $info['reference'];
        $payoutId = $info['transaction_id'];

        // Trouver le retrait par référence DexPay
        $withdrawal = WithdrawalRequest::where('dexpay_reference', $reference)
            ->orWhere('dexpay_payout_id', $payoutId)
            ->first();

        if (!$withdrawal) {
            Log::warning('DexPay payout webhook: withdrawal not found', [
                'reference' => $reference,
                'payout_id' => $payoutId,
            ]);
            $webhook->markAsProcessed("Payout completed but withdrawal not found: {$reference}");
            return;
        }

        // Éviter double traitement
        if ($withdrawal->status === 'completed') {
            Log::info('DexPay payout already completed', ['withdrawal_id' => $withdrawal->id]);
            $webhook->markAsProcessed("Payout already completed: {$withdrawal->id}");
            return;
        }

        // Marquer comme complété et débiter le wallet
        $withdrawal->update([
            'status' => 'completed',
            'dexpay_payout_id' => $payoutId,
            'processed_at' => now(),
        ]);

        // Débiter le wallet du marchand
        if ($withdrawal->wallet) {
            $withdrawal->wallet->debit(
                $withdrawal->walletDebitAmount(),
                "Retrait #{$withdrawal->id} - {$withdrawal->payout_method}",
                $withdrawal
            );
        }

        Log::info('DexPay payout completed via webhook', [
            'withdrawal_id' => $withdrawal->id,
            'amount' => $withdrawal->walletDebitAmount(),
        ]);

        $webhook->markAsProcessed("Payout completed: withdrawal #{$withdrawal->id}");
    }

    private function handlePayoutFailed(array $info, $webhook): void
    {
        $reference = $info['reference'];
        $reason = $info['failure_reason'] ?? 'Unknown';

        $withdrawal = WithdrawalRequest::where('dexpay_reference', $reference)->first();

        if ($withdrawal && $withdrawal->status === 'processing') {
            $withdrawal->update([
                'status' => 'pending',
                'admin_notes' => "Payout DexPay échoué: {$reason}",
            ]);

            Log::warning('DexPay payout failed', [
                'withdrawal_id' => $withdrawal->id,
                'reason' => $reason,
            ]);
        }

        $webhook->markAsProcessed("Payout failed: {$reference}, reason: {$reason}");
    }

    /**
     * Gère les chargebacks (contestations carte)
     */
    private function handleChargeback(array $info, $webhook): void
    {
        $event = $info['event'];
        $reference = $info['reference'];
        $amount = $info['amount'] ?? 0;
        $transactionId = $info['transaction_id'];

        Log::warning('DexPay chargeback received', [
            'event' => $event,
            'reference' => $reference,
            'amount' => $amount,
        ]);

        // Trouver la transaction originale
        $originalTx = WalletTransaction::where('dexpay_transaction_id', $transactionId)
            ->orWhere('dexpay_transaction_id', $reference)
            ->first();

        if (!$originalTx || !$originalTx->wallet) {
            Log::warning('DexPay chargeback: original transaction not found', [
                'reference' => $reference,
            ]);
            $webhook->markAsProcessed("Chargeback {$event}: transaction not found");
            return;
        }

        $wallet = $originalTx->wallet;

        switch ($event) {
            case 'chargeback.created':
                // Créer une réserve pour le montant contesté
                $wallet->applyReserve(
                    $amount,
                    'chargeback_pending',
                    null,
                    $reference,
                    "Contestation carte en cours - Transaction: {$transactionId}"
                );
                break;

            case 'chargeback.lost':
                // Le marchand perd la contestation : débiter le wallet (peut devenir négatif)
                $wallet->forceDebit(
                    $amount,
                    "Chargeback perdu - {$reference}",
                    'chargeback',
                    $originalTx
                );
                break;

            case 'chargeback.won':
                // Le marchand gagne : libérer la réserve si elle existe
                $reserve = $wallet->reserves()
                    ->where('reference', $reference)
                    ->where('status', 'active')
                    ->first();

                if ($reserve) {
                    $wallet->releaseReserve($reserve);
                }
                break;
        }

        $webhook->markAsProcessed("Chargeback {$event}: {$reference}, amount: {$amount}");
    }

    /**
     * Gère la libération des fonds carte par DexPay
     * Si DexPay envoie un webhook quand les fonds sont libérés
     */
    private function handleFundsReleased(array $info, $webhook): void
    {
        $transactionId = $info['transaction_id'];
        $reference = $info['reference'];

        // Trouver la transaction retenue
        $transaction = WalletTransaction::where('dexpay_transaction_id', $transactionId)
            ->orWhere('dexpay_transaction_id', $reference)
            ->where('release_status', '!=', 'released')
            ->first();

        if (!$transaction || !$transaction->wallet) {
            Log::info('DexPay funds.released: transaction not found or already released', [
                'reference' => $reference,
            ]);
            $webhook->markAsProcessed("Funds released: transaction not found");
            return;
        }

        // Libérer tous les fonds restants
        $transaction->wallet->releaseFunds($transaction, null, true);

        Log::info('DexPay funds released via webhook', [
            'transaction_id' => $transaction->id,
            'amount' => $transaction->held_amount,
        ]);

        $webhook->markAsProcessed("Funds released: {$reference}");
    }
}
