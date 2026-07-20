<?php

namespace App\Services\Payment\Gateways;

use App\Services\Payment\Exceptions\GatewayUnavailableException;
use App\Services\Payment\Exceptions\InvalidWebhookSignature;
use App\Services\Payment\PaymentGatewayInterface;
use App\Services\Payment\PaymentRequest;
use App\Services\Payment\PaymentResponse;
use App\Services\Payment\PaymentStatus;
use App\Services\Payment\PaymentStatusEnum;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Orange Money Senegal gateway adapter.
 *
 * Uses OAuth2 client_credentials to obtain a bearer token,
 * then hits the /webpayment endpoint to create a checkout session.
 *
 * Docs: https://developer.orange.com/apis/om-webpay-sn/
 *
 * Required .env:
 *   ORANGE_MONEY_CLIENT_ID=
 *   ORANGE_MONEY_CLIENT_SECRET=
 *   ORANGE_MONEY_MERCHANT_KEY=         # X-AUTH-KEY header
 *   ORANGE_MONEY_BASE_URL=https://api.orange.com
 *   ORANGE_MONEY_AUTHORIZATION_URL=https://api.orange.com/oauth/v3/token
 *   ORANGE_MONEY_COUNTRY=SN            # SN, CI, ML, BF, etc.
 *   ORANGE_MONEY_WEBHOOK_SECRET=       # For callback verification
 */
class OrangeMoneyGateway implements PaymentGatewayInterface
{
    private string $clientId;
    private string $clientSecret;
    private string $merchantKey;
    private string $baseUrl;
    private string $authUrl;
    private string $country;
    private string $webhookSecret;

    public function __construct()
    {
        $this->clientId      = config('services.orange_money.client_id', '');
        $this->clientSecret  = config('services.orange_money.client_secret', '');
        $this->merchantKey   = config('services.orange_money.merchant_key', '');
        $this->baseUrl       = config('services.orange_money.base_url', 'https://api.orange.com');
        $this->authUrl       = config('services.orange_money.authorization_url', 'https://api.orange.com/oauth/v3/token');
        $this->country       = config('services.orange_money.country', 'SN');
        $this->webhookSecret = config('services.orange_money.webhook_secret', '');
    }

    public function getName(): string
    {
        return 'Orange Money';
    }

    public function initiate(PaymentRequest $request): PaymentResponse
    {
        $this->assertConfigured();

        try {
            $token = $this->getAccessToken();

            $response = Http::withToken($token)
                ->withHeaders(['X-AUTH-KEY' => $this->merchantKey])
                ->timeout(15)
                ->post("{$this->baseUrl}/orange-money-webpay/{$this->country}/v1/webpayment", [
                    'merchant_key'    => $this->merchantKey,
                    'currency'        => $request->currency,
                    'order_id'        => $request->reference,
                    'amount'          => $request->amount,
                    'return_url'      => $request->returnUrl ?? $request->callbackUrl,
                    'cancel_url'      => $request->callbackUrl . '?status=cancel',
                    'notif_url'       => $request->callbackUrl,
                    'lang'            => 'fr',
                    'reference'       => $request->reference,
                    'metadata'        => json_encode($request->metadata),
                ]);

            if ($response->failed()) {
                Log::error('orange_money.initiate.failed', [
                    'status'    => $response->status(),
                    'body'      => $response->json(),
                    'reference' => $request->reference,
                ]);
                return new PaymentResponse(
                    success: false,
                    gatewayReference: null,
                    checkoutUrl: null,
                    ussdCode: null,
                    message: 'Orange Money: ' . ($response->json('message') ?? 'Erreur'),
                    rawResponse: $response->json() ?? [],
                );
            }

            $data = $response->json();

            return new PaymentResponse(
                success: true,
                gatewayReference: $data['pay_token'],
                checkoutUrl: $data['payment_url'],
                ussdCode: $data['notif_token'] ?? null,
                message: 'Paiement Orange Money initié',
                rawResponse: $data,
            );

        } catch (\Throwable $e) {
            Log::error('orange_money.initiate.exception', ['error' => $e->getMessage()]);
            throw new GatewayUnavailableException('Orange Money indisponible: ' . $e->getMessage(), 0, $e);
        }
    }

    public function checkStatus(string $gatewayReference): PaymentStatus
    {
        $this->assertConfigured();

        try {
            $token = $this->getAccessToken();

            $response = Http::withToken($token)
                ->withHeaders(['X-AUTH-KEY' => $this->merchantKey])
                ->timeout(10)
                ->get("{$this->baseUrl}/orange-money-webpay/{$this->country}/v1/transactionstatus", [
                    'order_id' => $gatewayReference,
                ]);

            if ($response->failed()) {
                Log::error('orange_money.check_status.failed', [
                    'status'    => $response->status(),
                    'reference' => $gatewayReference,
                ]);
                throw new GatewayUnavailableException(
                    'Orange Money checkStatus failed: HTTP ' . $response->status()
                );
            }

            return $this->normalizeStatus($response->json(), $gatewayReference);

        } catch (GatewayUnavailableException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('orange_money.check_status.exception', [
                'error'     => $e->getMessage(),
                'reference' => $gatewayReference,
            ]);
            throw new GatewayUnavailableException('Orange Money indisponible: ' . $e->getMessage(), 0, $e);
        }
    }

    public function verifyWebhook(string $payload, string $signature): bool
    {
        if (empty($this->webhookSecret) || strlen($this->webhookSecret) < 16) {
            throw new InvalidWebhookSignature(
                'ORANGE_MONEY_WEBHOOK_SECRET not configured or too short — refusing webhook'
            );
        }
        return hash_equals(
            hash_hmac('sha256', $payload, $this->webhookSecret),
            $signature
        );
    }

    public function parseWebhook(array $payload): PaymentStatus
    {
        return $this->normalizeStatus($payload, $payload['pay_token'] ?? '');
    }

    private function normalizeStatus(array $data, string $ref): PaymentStatus
    {
        $omStatus = $data['status'] ?? $data['transaction_status'] ?? 'PENDING';

        $status = match (strtoupper($omStatus)) {
            'SUCCESS', 'SUCCESSFULL', '00' => PaymentStatusEnum::SUCCESS,
            'PENDING', 'INITIATED'         => PaymentStatusEnum::PENDING,
            'EXPIRED'                      => PaymentStatusEnum::EXPIRED,
            'CANCELLED', 'CANCEL'          => PaymentStatusEnum::CANCELLED,
            default                        => PaymentStatusEnum::FAILED,
        };

        return new PaymentStatus(
            status:            $status,
            gatewayReference:  $ref,
            internalReference: $data['order_id'] ?? $data['reference'] ?? null,
            amount:            isset($data['amount']) ? (int) $data['amount'] : null,
            message:           "Orange Money: {$omStatus}",
            rawPayload:        $data,
        );
    }

    private function getAccessToken(): string
    {
        // Cache token for its TTL to avoid repeated OAuth calls
        return Cache::remember('orange_money_token', 3540, function () {
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->asForm()
                ->timeout(10)
                ->post($this->authUrl, ['grant_type' => 'client_credentials']);

            if ($response->failed()) {
                throw new GatewayUnavailableException(
                    'Orange Money OAuth failed: ' . $response->status()
                );
            }

            return $response->json('access_token');
        });
    }

    private function assertConfigured(): void
    {
        // Feature flag: Orange Money désactivé jusqu'à validation du code marchand
        if (! config('services.orange_money.enabled', false)) {
            throw new GatewayUnavailableException(
                'Orange Money est désactivé (en attente du code marchand). '
                . 'Mettre ORANGE_MONEY_ENABLED=true dans .env une fois validé.'
            );
        }

        if (empty($this->clientId) || empty($this->merchantKey)) {
            throw new GatewayUnavailableException(
                'Orange Money not configured. Set ORANGE_MONEY_CLIENT_ID and ORANGE_MONEY_MERCHANT_KEY in .env'
            );
        }
        if (empty($this->webhookSecret)) {
            throw new GatewayUnavailableException(
                'Orange Money webhook secret not configured. Set ORANGE_MONEY_WEBHOOK_SECRET in .env'
            );
        }
    }
}
