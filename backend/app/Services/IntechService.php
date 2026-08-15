<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class IntechService
{
    private string $apiKey;
    private string $apiSecret;
    private ?string $hmacSecret;
    private string $baseUrl;
    private string $env;

    public function __construct()
    {
        $this->apiKey = config('services.intech.api_key', '');
        $this->apiSecret = config('services.intech.api_secret', '');
        $this->hmacSecret = config('services.intech.hmac_secret');
        $this->baseUrl = config('services.intech.base_url', 'https://api.intech.sn');
        $this->env = config('services.intech.env', 'test');
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->apiSecret);
    }

    public function getBalance(): ?array
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $response = Http::withHeaders($this->headers())
                ->get("{$this->baseUrl}/api-services/balance");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Intech balance check failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('Intech balance exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    public function cashOut(string $phone, int $amount, string $provider, string $externalId): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Intech API not configured'];
        }

        $providerMap = [
            'wave' => 'WAVE_SN_API_CASH_OUT',
            'orange_money' => 'ORANGE_MONEY_SN_CASH_OUT',
            'free_money' => 'FREE_MONEY_SN_CASH_OUT',
        ];

        $service = $providerMap[$provider] ?? $providerMap['wave'];

        $payload = [
            'service' => $service,
            'amount' => $amount,
            'recipient' => $this->formatPhone($phone),
            'externalTransactionId' => $externalId,
            'callbackUrl' => route('webhooks.intech'),
        ];

        try {
            $response = Http::withHeaders($this->headers())
                ->post("{$this->baseUrl}/api-services/cashout", $payload);

            $data = $response->json();

            if ($response->successful() && ($data['status'] ?? '') === 'PENDING') {
                Log::info('Intech CashOut initiated', [
                    'externalId' => $externalId,
                    'transactionId' => $data['transactionId'] ?? null,
                    'amount' => $amount,
                    'provider' => $provider,
                ]);

                return [
                    'success' => true,
                    'transactionId' => $data['transactionId'] ?? null,
                    'status' => 'pending',
                    'data' => $data,
                ];
            }

            Log::error('Intech CashOut failed', [
                'status' => $response->status(),
                'body' => $data,
                'externalId' => $externalId,
            ]);

            return [
                'success' => false,
                'error' => $data['message'] ?? 'CashOut failed',
                'code' => $data['code'] ?? 'UNKNOWN',
            ];
        } catch (\Exception $e) {
            Log::error('Intech CashOut exception', [
                'error' => $e->getMessage(),
                'externalId' => $externalId,
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function verifyCallbackSignature(array $payload, string $signature): bool
    {
        $transactionId = $payload['transactionId'] ?? '';
        $externalTransactionId = $payload['externalTransactionId'] ?? '';

        $expectedSha256 = hash('sha256', "{$transactionId}|{$externalTransactionId}|{$this->apiKey}");

        if (hash_equals($expectedSha256, $signature)) {
            return true;
        }

        if ($this->hmacSecret) {
            $dataToSign = json_encode($payload);
            $expectedHmac = hash_hmac('sha256', $dataToSign, $this->hmacSecret);
            if (hash_equals($expectedHmac, $signature)) {
                return true;
            }
        }

        return false;
    }

    public function checkTransactionStatus(string $transactionId): ?array
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $response = Http::withHeaders($this->headers())
                ->get("{$this->baseUrl}/api-services/transaction/{$transactionId}");

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Intech status check exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    public function calculateFees(int $amount, string $provider): int
    {
        $rates = [
            'wave' => 0.02,
            'orange_money' => 0.015,
            'free_money' => 0.015,
            'bank_transfer' => 0.02,
        ];

        $rate = $rates[$provider] ?? 0.02;
        $fees = (int) ceil($amount * $rate);

        if ($provider === 'bank_transfer') {
            $fees += 100;
        }

        return $fees;
    }

    public function hasEnoughBalance(int $amount): bool
    {
        $balance = $this->getBalance();
        if (!$balance) {
            return false;
        }

        $available = $balance['available'] ?? $balance['balance'] ?? 0;
        return $available >= $amount;
    }

    private function headers(): array
    {
        return [
            'X-API-KEY' => $this->apiKey,
            'X-API-SECRET' => $this->apiSecret,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
    }

    private function formatPhone(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($phone, '221')) {
            return '+' . $phone;
        }

        if (str_starts_with($phone, '7') && strlen($phone) === 9) {
            return '+221' . $phone;
        }

        return '+221' . ltrim($phone, '0');
    }
}
