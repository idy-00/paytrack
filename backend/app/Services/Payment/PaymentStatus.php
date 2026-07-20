<?php

namespace App\Services\Payment;

enum PaymentStatusEnum: string
{
    case PENDING   = 'pending';
    case SUCCESS   = 'success';
    case FAILED    = 'failed';
    case CANCELLED = 'cancelled';
    case EXPIRED   = 'expired';
}

/**
 * Normalized status returned by checkStatus() and parseWebhook().
 */
readonly class PaymentStatus
{
    public function __construct(
        public PaymentStatusEnum $status,
        public string            $gatewayReference,
        /** Our internal sale reference (echoed back from metadata) */
        public ?string           $internalReference,
        public ?int              $amount,
        public string            $message,
        public array             $rawPayload = [],
    ) {}

    public function isSuccessful(): bool
    {
        return $this->status === PaymentStatusEnum::SUCCESS;
    }
}
