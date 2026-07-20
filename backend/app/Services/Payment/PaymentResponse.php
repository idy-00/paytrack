<?php

namespace App\Services\Payment;

/**
 * Value object returned by gateway->initiate().
 */
readonly class PaymentResponse
{
    public function __construct(
        public bool    $success,
        /** Gateway-assigned transaction ID to track this payment */
        public ?string $gatewayReference,
        /** For web-redirect gateways (e.g. Orange CI): URL to redirect the user to */
        public ?string $checkoutUrl,
        /** For USSD-push gateways (e.g. Wave Senegal): code to display to the user */
        public ?string $ussdCode,
        /** Human-readable status message */
        public string  $message,
        /** Full raw response from the gateway (for logging/debugging) */
        public array   $rawResponse = [],
    ) {}
}
