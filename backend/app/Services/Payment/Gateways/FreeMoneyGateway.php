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
 * Free Money (Tigo Cash / Free SN) gateway adapter.
 *
 * Free Money uses a merchant API with an API key + secret.
 * The exact endpoint paths depend on the contract with Free SN.
 *
 * Required .env:
 *   FREE_MONEY_API_KEY=
 *   FREE_MONEY_API_SECRET=
 *   FREE_MONEY_MERCHANT_CODE=
 *   FREE_MONEY_BASE_URL=https://api.free-mobile.sn/payment/v1   (confirm with Free SN)
 *   FREE_MONEY_WEBHOOK_SECRET=
 */
class FreeMoneyGateway implements PaymentGatewayInterface
{
    private string $apiKey;
    private string $apiSecret;
    private string $merchantCode;
    private string $baseUrl;
    private string $webhookSecret;

    public function __construct()
    {
        $this->apiKey        = config('services.free_money.api_key', '');
        $this->apiSecret     = config('services.free_money.api_secret', '');
        $this->merchantCode  = config('services.free_money.merchant_code', '');
        $this->baseUrl       = config('services.free_money.base_url', 'https://api.free-mobile.sn/payment/v1');
        $this->webhookSecret = config('services.free_money.webhook_secret', '');
    }

    public function getName(): string
    {
        return 'Free Money';
    }

    public function initiate(PaymentRequest $request): PaymentResponse
    {
        $this->assertConfigured();

        $timestamp = now()->timestamp;
        $signature = $this->buildSignature($request->reference, $request->amount, $timestamp);

        try {
            $response = Http::withHeaders([
                'X-API-KEY'       => $this->apiKey,
                'X-SIGNATURE'     => $signature,
                'X-TIMESTAMP'     => $timestamp,
                'X-MERCHANT-CODE' => $this->merchantCode,
            ])
            ->timeout(15)
            ->post("{$this->baseUrl}/initiate", [
                'amount'        => $request->amount,
                'currency'      => $request->currency,
                'phone'         => $request->phone,
                'reference'     => $request->reference,
                'description'   => $request->description,
                'callback_url'  => $request->callbackUrl,
                'return_url'    => $request->returnUrl,
            ]);

            if ($response->failed()) {
                Log::error('free_money.initiate.failed', [
                    'status' => $response->status(),
                    'body'   => $response->json(),
                ]);
                return new PaymentResponse(
                    success: false,
                    gatewayReference: null,
                    checkoutUrl: null,
                    ussdCode: null,
                    message: 'Free Money: ' . ($response->json('message') ?? 'Erreur'),
                    rawResponse: $response->json() ?? [],
                );
            }

            $data = $response->json();

            return new PaymentResponse(
                success: true,
                gatewayReference: $data['transaction_id'] ?? $data['id'],
                checkoutUrl: $data['checkout_url'] ?? null,
                ussdCode: $data['ussd_code'] ?? null,
                message: 'Paiement Free Money initié',
                rawResponse: $data,
            );

        } catch (\Throwable $e) {
            Log::error('free_money.initiate.exception', ['error' => $e->getMessage()]);
            throw new GatewayUnavailableException('Free Money indisponible: ' . $e->getMessage(), 0, $e);
        }
    }

    public function checkStatus(string $gatewayReference): PaymentStatus
    {
        $this->assertConfigured();

        try {
            $timestamp = now()->timestamp;

            $response = Http::withHeaders([
                'X-API-KEY'   => $this->apiKey,
                'X-TIMESTAMP' => $timestamp,
                'X-SIGNATURE' => hash_hmac('sha256', $gatewayReference . $timestamp, $this->apiSecret),
            ])
            ->timeout(10)
            ->get("{$this->baseUrl}/status/{$gatewayReference}");

            if ($response->failed()) {
                Log::error('free_money.check_status.failed', [
                    'status'    => $response->status(),
                    'reference' => $gatewayReference,
                ]);
                throw new GatewayUnavailableException(
                    'Free Money checkStatus failed: HTTP ' . $response->status()
                );
            }

            return $this->normalizeStatus($response->json(), $gatewayReference);

        } catch (GatewayUnavailableException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('free_money.check_status.exception', [
                'error'     => $e->getMessage(),
                'reference' => $gatewayReference,
            ]);
            throw new GatewayUnavailableException('Free Money indisponible: ' . $e->getMessage(), 0, $e);
        }
    }

    public function verifyWebhook(string $payload, string $signature): bool
    {
        if (empty($this->webhookSecret) || strlen($this->webhookSecret) < 16) {
            throw new InvalidWebhookSignature(
                'FREE_MONEY_WEBHOOK_SECRET not configured or too short — refusing webhook'
            );
        }
        return hash_equals(
            hash_hmac('sha256', $payload, $this->webhookSecret),
            $signature
        );
    }

    public function parseWebhook(array $payload): PaymentStatus
    {
        return $this->normalizeStatus($payload, $payload['transaction_id'] ?? '');
    }

    private function normalizeStatus(array $data, string $ref): PaymentStatus
    {
        $fmStatus = strtoupper($data['status'] ?? 'PENDING');

        $status = match ($fmStatus) {
            'SUCCESS', 'COMPLETED', 'PAID' => PaymentStatusEnum::SUCCESS,
            'PENDING', 'INITIATED'         => PaymentStatusEnum::PENDING,
            'EXPIRED'                      => PaymentStatusEnum::EXPIRED,
            'CANCELLED'                    => PaymentStatusEnum::CANCELLED,
            default                        => PaymentStatusEnum::FAILED,
        };

        return new PaymentStatus(
            status:            $status,
            gatewayReference:  $ref,
            internalReference: $data['reference'] ?? null,
            amount:            isset($data['amount']) ? (int) $data['amount'] : null,
            message:           "Free Money: {$fmStatus}",
            rawPayload:        $data,
        );
    }

    private function buildSignature(string $reference, int $amount, int $timestamp): string
    {
        $raw = implode('|', [$this->merchantCode, $reference, $amount, $timestamp]);
        return hash_hmac('sha256', $raw, $this->apiSecret);
    }

    private function assertConfigured(): void
    {
        if (empty($this->apiKey) || empty($this->merchantCode)) {
            throw new GatewayUnavailableException(
                'Free Money not configured. Set FREE_MONEY_API_KEY and FREE_MONEY_MERCHANT_CODE in .env'
            );
        }
        if (empty($this->webhookSecret)) {
            throw new GatewayUnavailableException(
                'Free Money webhook secret not configured. Set FREE_MONEY_WEBHOOK_SECRET in .env'
            );
        }
    }
}
