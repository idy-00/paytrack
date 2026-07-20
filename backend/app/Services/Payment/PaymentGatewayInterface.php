<?php

namespace App\Services\Payment;

/**
 * Contract for all mobile money / payment gateway adapters.
 * Each gateway (Wave, Orange Money, Free Money, etc.) implements this.
 */
interface PaymentGatewayInterface
{
    /**
     * Initiate a payment request.
     * Returns a gateway-specific response (checkout URL, USSD code, etc.)
     */
    public function initiate(PaymentRequest $request): PaymentResponse;

    /**
     * Check the current status of a payment by gateway reference.
     */
    public function checkStatus(string $gatewayReference): PaymentStatus;

    /**
     * Verify an inbound webhook signature.
     * Throws \App\Services\Payment\Exceptions\InvalidWebhookSignature on failure.
     */
    public function verifyWebhook(string $payload, string $signature): bool;

    /**
     * Parse an inbound webhook payload into a normalized PaymentStatus.
     */
    public function parseWebhook(array $payload): PaymentStatus;

    /**
     * Human-readable name for this gateway.
     */
    public function getName(): string;
}
