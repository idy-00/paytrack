<?php

namespace App\Services\Payment;

/**
 * Value object: parameters needed to initiate a mobile money payment.
 */
readonly class PaymentRequest
{
    public function __construct(
        /** Amount in XOF (FCFA), integer */
        public int    $amount,
        /** Customer phone number (international format: +221XXXXXXXXX) */
        public string $phone,
        /** Internal reference — used to correlate callbacks */
        public string $reference,
        /** Human-readable description shown to the customer */
        public string $description,
        /** Webhook/callback URL the gateway will call on status change */
        public string $callbackUrl,
        /** ISO-4217 currency code */
        public string $currency = 'XOF',
        /** Optional: redirect URL after web checkout */
        public ?string $returnUrl = null,
        /** Additional metadata passed through to webhooks */
        public array  $metadata = [],
    ) {}
}
