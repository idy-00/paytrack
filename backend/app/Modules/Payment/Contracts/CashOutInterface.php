<?php

namespace App\Modules\Payment\Contracts;

interface CashOutInterface
{
    public function isConfigured(): bool;
    public function getBalance(): ?array;
    public function hasEnoughBalance(int $amount): bool;
    public function cashOut(string $phone, int $amount, string $provider, string $externalId): array;
    public function calculateFees(int $amount, string $provider): int;
    public function checkTransactionStatus(string $transactionId): ?array;
}
