<?php

namespace App\Modules\Payment\Contracts;

interface WalletInterface
{
    public function credit(int $amount, string $description, $transactionable = null, string $externalId = null);
    public function debit(int $amount, string $description, $transactionable = null);
    public function canWithdraw(int $amount): bool;
    public function getBalance(): int;
}
