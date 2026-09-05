<?php

namespace App\Services\Payment\Gateways;

use App\Services\DexpayService;
use App\Services\Payment\PaymentGatewayInterface;
use App\Services\Payment\PaymentRequest;
use App\Services\Payment\PaymentResponse;
use App\Services\Payment\PaymentStatus;
use App\Services\Payment\PaymentStatusEnum;
use Illuminate\Support\Facades\Log;

/**
 * DexPay Gateway - Agrégateur mobile money Afrique de l'Ouest
 * Opérateurs : Wave, Orange Money, MTN, Moov
 *
 * @see https://docs.dexpay.africa
 */
class DexpayGateway implements PaymentGatewayInterface
{
    public function __construct(
        private DexpayService $dexpay
    ) {}

    public function initiate(PaymentRequest $request): PaymentResponse
    {
        if (!$this->dexpay->isConfigured()) {
            return new PaymentResponse(
                success: false,
                gatewayReference: null,
                checkoutUrl: null,
                ussdCode: null,
                message: 'DexPay non configuré',
            );
        }

        try {
            $response = $this->dexpay->createCheckoutSession([
                'amount' => $request->amount,
                'currency' => $request->currency,
                'reference' => $request->reference,
                'description' => $request->description,
                'customer' => [
                    'phone' => $request->phone,
                ],
                'success_url' => $request->returnUrl,
                'cancel_url' => $request->returnUrl,
                'webhook_url' => $request->callbackUrl,
                'metadata' => $request->metadata,
            ]);

            $session = $response['data'] ?? $response;
            $checkoutSessionId = $session['id'] ?? $session['checkout_session_id'] ?? null;
            $paymentUrl = $session['payment_url'] ?? $session['url'] ?? null;

            if (!is_string($paymentUrl) || $paymentUrl === '') {
                throw new \RuntimeException('DexPay n’a pas retourné de lien de paiement.');
            }

            return new PaymentResponse(
                success: true,
                gatewayReference: $checkoutSessionId,
                checkoutUrl: $paymentUrl,
                ussdCode: null,
                message: 'Session de paiement créée',
                rawResponse: $response,
            );

        } catch (\Exception $e) {
            Log::error('DexPay initiate failed', [
                'error' => $e->getMessage(),
                'reference' => $request->reference,
            ]);

            return new PaymentResponse(
                success: false,
                gatewayReference: null,
                checkoutUrl: null,
                ussdCode: null,
                message: $e->getMessage(),
            );
        }
    }

    public function checkStatus(string $gatewayReference): PaymentStatus
    {
        $session = $this->dexpay->getCheckoutSession($gatewayReference);

        if (!$session) {
            return new PaymentStatus(
                status: PaymentStatusEnum::PENDING,
                gatewayReference: $gatewayReference,
                internalReference: null,
                amount: null,
                message: 'Session introuvable',
            );
        }

        $status = $this->mapStatus($session['status'] ?? 'pending');
        $data = $session['data'] ?? $session;

        return new PaymentStatus(
            status: $status,
            gatewayReference: $gatewayReference,
            internalReference: $data['reference'] ?? null,
            amount: $data['amount'] ?? null,
            message: $this->getStatusMessage($status),
            rawPayload: $session,
        );
    }

    public function verifyWebhook(string $payload, string $signature): bool
    {
        return $this->dexpay->verifyWebhookSignature($payload, $signature);
    }

    public function parseWebhook(array $payload): PaymentStatus
    {
        $info = $this->dexpay->extractPaymentInfo($payload);
        $event = $info['event'] ?? '';

        $status = match($event) {
            'checkout.completed' => PaymentStatusEnum::SUCCESS,
            'checkout.failed' => PaymentStatusEnum::FAILED,
            'checkout.cancelled' => PaymentStatusEnum::CANCELLED,
            'checkout.initiated' => PaymentStatusEnum::PENDING,
            default => PaymentStatusEnum::PENDING,
        };

        return new PaymentStatus(
            status: $status,
            gatewayReference: $info['transaction_id'] ?? $info['checkout_session_id'] ?? '',
            internalReference: $info['reference'],
            amount: $info['amount'],
            message: $info['failure_reason'] ?? $this->getStatusMessage($status),
            rawPayload: $payload,
        );
    }

    public function getName(): string
    {
        return 'DexPay';
    }

    private function mapStatus(string $dexpayStatus): PaymentStatusEnum
    {
        return match(strtolower($dexpayStatus)) {
            'success', 'completed' => PaymentStatusEnum::SUCCESS,
            'failed' => PaymentStatusEnum::FAILED,
            'cancelled' => PaymentStatusEnum::CANCELLED,
            'expired' => PaymentStatusEnum::EXPIRED,
            default => PaymentStatusEnum::PENDING,
        };
    }

    private function getStatusMessage(PaymentStatusEnum $status): string
    {
        return match($status) {
            PaymentStatusEnum::SUCCESS => 'Paiement réussi',
            PaymentStatusEnum::FAILED => 'Paiement échoué',
            PaymentStatusEnum::CANCELLED => 'Paiement annulé',
            PaymentStatusEnum::EXPIRED => 'Session expirée',
            PaymentStatusEnum::PENDING => 'Paiement en attente',
        };
    }
}
