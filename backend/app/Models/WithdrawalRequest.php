<?php

namespace App\Models;

use App\Services\IntechService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WithdrawalRequest extends Model
{
    protected $fillable = [
        'tenant_id', 'wallet_id', 'requested_by', 'amount', 'fees', 'net_amount',
        'payout_method', 'payout_account', 'status',
        'processed_by', 'processed_at', 'admin_notes', 'payout_reference',
        'intech_external_id', 'intech_transaction_id',
    ];

    protected $casts = [
        'amount' => 'integer',
        'fees' => 'integer',
        'net_amount' => 'integer',
        'processed_at' => 'datetime',
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function wallet() { return $this->belongsTo(Wallet::class); }
    public function requestedBy() { return $this->belongsTo(User::class, 'requested_by'); }
    public function processedBy() { return $this->belongsTo(User::class, 'processed_by'); }

    public function isPending(): bool { return $this->status === 'pending'; }
    public function isProcessing(): bool { return $this->status === 'processing'; }
    public function isCompleted(): bool { return $this->status === 'completed'; }

    public function initiateCashOut(): array
    {
        if (!$this->isPending()) {
            return ['success' => false, 'error' => 'Withdrawal not in pending status'];
        }

        if (!$this->tenant->isKycApproved()) {
            return ['success' => false, 'error' => 'KYC not approved'];
        }

        $intech = app(IntechService::class);

        if (!$intech->isConfigured()) {
            return ['success' => false, 'error' => 'Intech API not configured'];
        }

        if (!$intech->hasEnoughBalance($this->amount)) {
            $this->update([
                'admin_notes' => 'Solde Intech ATAABA insuffisant. En attente réapprovisionnement.',
            ]);
            return ['success' => false, 'error' => 'Insufficient ATAABA balance'];
        }

        $externalId = 'WD-' . $this->id . '-' . Str::random(8);
        $fees = $intech->calculateFees($this->amount, $this->payout_method);
        $netAmount = $this->amount - $fees;

        $this->update([
            'status' => 'processing',
            'intech_external_id' => $externalId,
            'fees' => $fees,
            'net_amount' => $netAmount,
        ]);

        $result = $intech->cashOut(
            $this->payout_account,
            $this->amount,
            $this->payout_method,
            $externalId
        );

        if (!$result['success']) {
            $this->update([
                'status' => 'pending',
                'admin_notes' => 'CashOut échoué: ' . ($result['error'] ?? 'Unknown error'),
            ]);
        } else {
            $this->update([
                'intech_transaction_id' => $result['transactionId'] ?? null,
            ]);
        }

        return $result;
    }

    public function approve(User $admin, string $payoutRef = null): void
    {
        $this->update([
            'status' => 'completed',
            'processed_by' => $admin->id,
            'processed_at' => now(),
            'payout_reference' => $payoutRef,
        ]);

        $this->wallet->debit($this->amount, "Retrait #{$this->id}", $this);
    }

    public function reject(User $admin, string $reason): void
    {
        $this->update([
            'status' => 'rejected',
            'processed_by' => $admin->id,
            'processed_at' => now(),
            'admin_notes' => $reason,
        ]);
    }
}
