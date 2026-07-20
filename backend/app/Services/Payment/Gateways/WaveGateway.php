<?php

namespace App\Services\Payment\Gateways;

use App\Services\Payment\Exceptions\GatewayUnavailableException;
use App\Services\Payment\Exceptions\InvalidWebhookSignature;
use App\Services\Payment\PaymentGatewayInterface;
use App\Services\Payment\PaymentRequest;
use App\Services\Payment\PaymentResponse;
use App\Services\Payment\PaymentStatus;
use App\Services\Payment\PaymentStatusEnum;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Wave Senegal payment gateway adapter.
 *
 * Docs: https://wave.com/en/docs/
 * Auth: Bearer token (WAVE_API_KEY)
 * Webhook signature: HMAC-SHA256 with WAVE_WEBHOOK_SECRET
 *
 * Required .env:
 *   WAVE_API_KEY=your_wave_api_key
 *   WAVE_WEBHOOK_SECRET=your_wave_webhook_secret
 *   WAVE_BASE_URL=https://api.wave.com/v1  (override for sandbox)
 */
class WaveGateway implements PaymentGatewayInterface
{
    private string $apiKey;
    private string $webhookSecret;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey        = config('services.wave.api_key', '');
        $this->webhookSecret = config('services.wave.webhook_secret', '');
        $this->baseUrl       = config('services.wave.base_url', 'https://api.wave.com/v1');
    }

    public function getName(): string
    {
        return 'Wave';
    }

    public function initiate(PaymentRequest $request): PaymentResponse
    {
        $this->assertConfigured();

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(15)
                ->post("{$this->baseUrl}/checkout/sessions", [
                    'currency'         => $request->currency,
                    'amount'           => $request->amount,
                    'error_url'        => $request->callbackUrl . '?status=error',
                    'success_url'      => $request->returnUrl ?? $request->callbackUrl,
                    'client_reference' => $request->reference,
                    'restrict_payer_mobile' => $request->phone,
                    // Wave passes back client_reference in webhook — used to correlate
                ]);

            if ($response->failed()) {
                Log::error('wave.initiate.failed', [
                    'status'    => $response->status(),
                    'body'      => $response->json(),
                    'reference' => $request->reference,
                ]);
                return new PaymentResponse(
                    success: false,
                    gatewayReference: null,
                    checkoutUrl: null,
                    ussdCode: null,
                    message: 'Wave: ' . ($response->json('message') ?? 'Erreur inconnue'),
                    rawResponse: $response->json() ?? [],
                );
            }

            $data = $response->json();

            return new PaymentResponse(
                success: true,
                gatewayReference: $data['id'],
                checkoutUrl: $data['wave_launch_url'],
                ussdCode: null,
                message: 'Paiement Wave initié',
                rawResponse: $data,
            );

        } catch (\Throwable $e) {
            Log::error('wave.initiate.exception', ['error' => $e->getMessage()]);
            throw new GatewayUnavailableException('Wave indisponible: ' . $e->getMessage(), 0, $e);
        }
    }

    public function checkStatus(string $gatewayReference): PaymentStatus
    {
        $this->assertConfigured();

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(10)
                ->get("{$this->baseUrl}/checkout/sessions/{$gatewayReference}");

            if ($response->failed()) {
                Log::error('wave.check_status.failed', [
                    'status'    => $response->status(),
                    'reference' => $gatewayReference,
                ]);
                throw new GatewayUnavailableException(
                    'Wave checkStatus failed: HTTP ' . $response->status()
                );
            }

            return $this->normalizeStatus($response->json());

        } catch (GatewayUnavailableException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('wave.check_status.exception', [
                'error'     => $e->getMessage(),
                'reference' => $gatewayReference,
            ]);
            throw new GatewayUnavailableException('Wave indisponible: ' . $e->getMessage(), 0, $e);
        }
    }

    public function verifyWebhook(string $payload, string $signature): bool
    {
        if (empty($this->webhookSecret) || strlen($this->webhookSecret) < 16) {
            throw new InvalidWebhookSignature(
                'WAVE_WEBHOOK_SECRET not configured or too short — refusing webhook'
            );
        }
        $expected = hash_hmac('sha256', $payload, $this->webhookSecret);
        // Timing-safe comparison
        return hash_equals($expected, $signature);
    }

    public function parseWebhook(array $payload): PaymentStatus
    {
        return $this->normalizeStatus($payload);
    }

    private function normalizeStatus(array $data): PaymentStatus
    {
        $waveStatus = $data['payment_status'] ?? $data['status'] ?? 'unknown';

        $status = match ($waveStatus) {
            'succeeded'           => PaymentStatusEnum::SUCCESS,
            'processing', 'new'  => PaymentStatusEnum::PENDING,
            'cancelled'           => PaymentStatusEnum::CANCELLED,
            'failed'              => PaymentStatusEnum::FAILED,
            default               => PaymentStatusEnum::PENDING,
        };

        return new PaymentStatus(
            status:            $status,
            gatewayReference:  $data['id'] ?? '',
            internalReference: $data['client_reference'] ?? null,
            amount:            isset($data['amount']) ? (int) $data['amount'] : null,
            message:           "Wave: {$waveStatus}",
            rawPayload:        $data,
        );
    }

    private function assertConfigured(): void
    {
        if (empty($this->apiKey)) {
            throw new GatewayUnavailableException(
                'Wave API key not configured. Set WAVE_API_KEY in .env'
            );
        }
        if (empty($this->webhookSecret)) {
            throw new GatewayUnavailableException(
                'Wave webhook secret not configured. Set WAVE_WEBHOOK_SECRET in .env'
            );
        }
    }
}
