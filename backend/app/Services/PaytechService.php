<?php

namespace App\Services;

use App\Models\PaytechWebhook;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaytechService
{
    private string $apiKey;
    private string $apiSecret;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.paytech.api_key', '');
        $this->apiSecret = config('services.paytech.api_secret', '');
        $this->baseUrl = config('services.paytech.base_url', 'https://paytech.sn/api');
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->apiSecret);
    }

    public function initiatePayment(array $data): array
    {
        if (!$this->isConfigured()) {
            throw new \Exception('PayTech not configured');
        }

        $payload = [
            'item_name' => $data['item_name'],
            'item_price' => $data['amount'],
            'currency' => 'XOF',
            'ref_command' => $data['reference'],
            'command_name' => $data['description'] ?? $data['item_name'],
            'env' => config('services.paytech.env', 'test'),
            'ipn_url' => route('webhooks.paytech'),
            'success_url' => $data['success_url'] ?? config('app.frontend_url') . '/payment/success',
            'cancel_url' => $data['cancel_url'] ?? config('app.frontend_url') . '/payment/cancel',
            'custom_field' => json_encode($data['metadata'] ?? []),
        ];

        $response = Http::withHeaders([
            'API_KEY' => $this->apiKey,
            'API_SECRET' => $this->apiSecret,
        ])->post("{$this->baseUrl}/payment/request-payment", $payload);

        if (!$response->successful()) {
            Log::error('PayTech payment init failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('Échec initiation paiement PayTech');
        }

        return $response->json();
    }

    public function verifySignature(array $payload, string $signature): bool
    {
        $computed = hash_hmac('sha256', json_encode($payload), $this->apiSecret);
        return hash_equals($computed, $signature);
    }

    public function verifyTransaction(string $transactionId): ?array
    {
        if (!$this->isConfigured()) return null;

        $response = Http::withHeaders([
            'API_KEY' => $this->apiKey,
            'API_SECRET' => $this->apiSecret,
        ])->get("{$this->baseUrl}/payment/check-status/{$transactionId}");

        if (!$response->successful()) {
            Log::warning('PayTech verify failed', ['txn' => $transactionId]);
            return null;
        }

        return $response->json();
    }

    public function isTransactionProcessed(string $transactionId): bool
    {
        return PaytechWebhook::where('paytech_transaction_id', $transactionId)
            ->where('processing_status', 'processed')
            ->exists();
    }

    public function logWebhook(array $payload, string $signature, string $ip): PaytechWebhook
    {
        $transactionId = $payload['transaction_id'] ?? $payload['ref_command'] ?? 'unknown';
        $isValid = $this->verifySignature($payload, $signature);

        return PaytechWebhook::create([
            'paytech_transaction_id' => $transactionId,
            'event_type' => $payload['type_event'] ?? 'payment',
            'payload' => $payload,
            'signature_received' => $signature,
            'signature_valid' => $isValid,
            'ip_address' => $ip,
            'processing_status' => $isValid ? 'received' : 'failed',
            'processing_notes' => $isValid ? null : 'Invalid signature',
        ]);
    }
}
