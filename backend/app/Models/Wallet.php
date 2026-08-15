<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Wallet extends Model
{
    protected $fillable = [
        'tenant_id', 'balance', 'pending_balance', 'total_credits', 'total_debits',
    ];

    protected $casts = [
        'balance' => 'integer',
        'pending_balance' => 'integer',
        'total_credits' => 'integer',
        'total_debits' => 'integer',
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function transactions() { return $this->hasMany(WalletTransaction::class); }
    public function withdrawalRequests() { return $this->hasMany(WithdrawalRequest::class); }

    public function credit(int $amount, string $description, $transactionable = null, string $paytechId = null): WalletTransaction
    {
        return DB::transaction(function () use ($amount, $description, $transactionable, $paytechId) {
            $this->lockForUpdate();
            $this->increment('balance', $amount);
            $this->increment('total_credits', $amount);
            $this->refresh();

            return $this->transactions()->create([
                'tenant_id' => $this->tenant_id,
                'type' => 'credit',
                'amount' => $amount,
                'balance_after' => $this->balance,
                'description' => $description,
                'paytech_transaction_id' => $paytechId,
                'transactionable_type' => $transactionable ? get_class($transactionable) : null,
                'transactionable_id' => $transactionable?->id,
            ]);
        });
    }

    public function debit(int $amount, string $description, $transactionable = null): WalletTransaction
    {
        return DB::transaction(function () use ($amount, $description, $transactionable) {
            $this->lockForUpdate();
            if ($this->balance < $amount) {
                throw new \Exception('Solde insuffisant');
            }
            $this->decrement('balance', $amount);
            $this->increment('total_debits', $amount);
            $this->refresh();

            return $this->transactions()->create([
                'tenant_id' => $this->tenant_id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => $this->balance,
                'description' => $description,
                'transactionable_type' => $transactionable ? get_class($transactionable) : null,
                'transactionable_id' => $transactionable?->id,
            ]);
        });
    }

    public function canWithdraw(int $amount): bool
    {
        return $this->balance >= $amount;
    }
}
