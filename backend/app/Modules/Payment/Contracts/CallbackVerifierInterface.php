<?php

namespace App\Modules\Payment\Contracts;

interface CallbackVerifierInterface
{
    public function verifySignature(array $payload, string $signature): bool;
    public function extractTransactionId(array $payload): ?string;
    public function extractExternalId(array $payload): ?string;
    public function extractStatus(array $payload): ?string;
    public function isSuccess(array $payload): bool;
    public function isFailed(array $payload): bool;
}
