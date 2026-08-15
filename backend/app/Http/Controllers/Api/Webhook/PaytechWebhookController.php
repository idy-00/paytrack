<?php

namespace App\Http\Controllers\Api\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\SubscriptionInvoice;
use App\Models\Tenant;
use App\Services\PaytechService;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaytechWebhookController extends Controller
{
    public function __construct(
        private PaytechService $paytechService,
        private SubscriptionService $subscriptionService
    ) {}

    public function __invoke(Request $request)
    {
        $payload = $request->all();
        $signature = $request->header('X-Paytech-Signature', '');
        $ip = $request->ip();

        // Log webhook
        $webhook = $this->paytechService->logWebhook($payload, $signature, $ip);

        // Verify signature
        if (!$webhook->signature_valid) {
            Log::warning('PayTech webhook invalid signature', [
                'ip' => $ip,
                'payload' => $payload,
            ]);
            return response()->json(['status' => 'invalid_signature'], 401);
        }

        $transactionId = $payload['transaction_id'] ?? null;
        $status = $payload['status'] ?? $payload['payment_status'] ?? null;

        if (!$transactionId) {
            $webhook->markFailed('Missing transaction_id');
            return response()->json(['status' => 'missing_transaction_id'], 400);
        }

        // Idempotence check
        if ($this->paytechService->isTransactionProcessed($transactionId)) {
            $webhook->markIgnored('Already processed');
            return response()->json(['status' => 'already_processed']);
        }

        // Only process successful payments
        if (!in_array($status, ['success', 'SUCCESS', 'completed', 'COMPLETED'])) {
            $webhook->markIgnored("Status not success: {$status}");
            return response()->json(['status' => 'ignored_status']);
        }

        // Double-check with PayTech API
        $verification = $this->paytechService->verifyTransaction($transactionId);
        if (!$verification || !in_array($verification['status'] ?? '', ['success', 'SUCCESS', 'completed', 'COMPLETED'])) {
            $webhook->markFailed('Verification failed');
            Log::warning('PayTech verification failed', ['txn' => $transactionId, 'verification' => $verification]);
            return response()->json(['status' => 'verification_failed'], 400);
        }

        // Process based on metadata
        $metadata = json_decode($payload['custom_field'] ?? '{}', true);
        $type = $metadata['type'] ?? null;

        try {
            DB::transaction(function () use ($type, $metadata, $payload, $transactionId, $webhook) {
                switch ($type) {
                    case 'subscription_invoice':
                        $this->processSubscriptionPayment($metadata, $transactionId);
                        break;

                    case 'order_payment':
                        $this->processOrderPayment($metadata, $payload, $transactionId);
                        break;

                    default:
                        Log::info('PayTech webhook unknown type', ['type' => $type, 'payload' => $payload]);
                }

                $webhook->markProcessed("Processed as {$type}");
            });

            return response()->json(['status' => 'processed']);

        } catch (\Exception $e) {
            $webhook->markFailed($e->getMessage());
            Log::error('PayTech webhook processing error', [
                'error' => $e->getMessage(),
                'txn' => $transactionId,
            ]);
            return response()->json(['status' => 'processing_error'], 500);
        }
    }

    private function processSubscriptionPayment(array $metadata, string $transactionId): void
    {
        $invoiceId = $metadata['invoice_id'] ?? null;
        if (!$invoiceId) return;

        $invoice = SubscriptionInvoice::find($invoiceId);
        if (!$invoice || $invoice->isPaid()) return;

        $this->subscriptionService->activateFromPayment($invoice, $transactionId);

        Log::info('Subscription activated via PayTech', [
            'invoice_id' => $invoiceId,
            'tenant_id' => $invoice->tenant_id,
        ]);
    }

    private function processOrderPayment(array $metadata, array $payload, string $transactionId): void
    {
        $orderId = $metadata['order_id'] ?? null;
        $tenantId = $metadata['tenant_id'] ?? null;
        if (!$orderId || !$tenantId) return;

        $order = Order::find($orderId);
        if (!$order || $order->tenant_id != $tenantId) return;

        // Check if already recorded
        if (OrderPayment::where('paytech_transaction_id', $transactionId)->exists()) {
            return;
        }

        $amount = $payload['amount'] ?? $payload['payment_amount'] ?? 0;

        // Record payment
        $payment = OrderPayment::create([
            'tenant_id' => $tenantId,
            'order_id' => $orderId,
            'recorded_by' => null, // System
            'receipt_number' => OrderPayment::generateReceiptNumber(),
            'amount' => $amount,
            'payment_date' => now(),
            'payment_method' => $this->mapPaytechMethod($payload['payment_method'] ?? 'card'),
            'paytech_transaction_id' => $transactionId,
            'source' => 'paytech',
            'notes' => 'Paiement en ligne PayTech',
        ]);

        // Credit merchant wallet
        $tenant = Tenant::find($tenantId);
        if ($tenant) {
            $wallet = $tenant->getOrCreateWallet();
            $wallet->credit(
                $amount,
                "Paiement commande {$order->reference}",
                $order,
                $transactionId
            );
        }

        Log::info('Order payment recorded via PayTech', [
            'order_id' => $orderId,
            'amount' => $amount,
            'txn' => $transactionId,
        ]);
    }

    private function mapPaytechMethod(string $method): string
    {
        return match(strtolower($method)) {
            'wave' => 'wave',
            'orange_money', 'orange-money', 'om' => 'orange_money',
            'free_money', 'free-money' => 'free_money',
            'wizall' => 'wizall',
            'emoney', 'e-money' => 'emoney',
            default => 'card',
        };
    }
}
