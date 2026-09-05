<?php

namespace App\Models;

use App\Services\DexpayService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WithdrawalRequest extends Model
{
    protected $fillable = [
        'tenant_id', 'wallet_id', 'requested_by', 'amount', 'fees', 'net_amount',
        'payout_method', 'payout_account', 'status',
        'processed_by', 'processed_at', 'admin_notes', 'payout_reference',
        // Legacy Intech (conservé pour compat)
        'intech_external_id', 'intech_transaction_id',
        // DexPay
        'dexpay_reference', 'dexpay_payout_id',
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

    /**
     * Mapper payout_method vers le provider DexPay
     */
    public function getDexpayProvider(): string
    {
        return match($this->payout_method) {
            'wave' => 'wave_sn_payout',
            'orange_money' => 'om_sn_payout',
            'free_money' => 'mixx_sn_payout',  // Fallback Mixx By Yas
            default => 'wave_sn_payout',
        };
    }

    public function initiateCashOut(): array
    {
        $dexpay = app(DexpayService::class);

        if (!$dexpay->isConfigured()) {
            return ['success' => false, 'error' => 'DexPay API not configured'];
        }

        // Verrou atomique pour éviter les double payouts (race condition)
        return \DB::transaction(function () use ($dexpay) {
            // Recharger avec verrou exclusif
            $locked = self::where('id', $this->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            if (!$locked) {
                return ['success' => false, 'error' => 'Withdrawal not in pending status or already processing'];
            }

            if (!$locked->tenant->isKycApproved()) {
                return ['success' => false, 'error' => 'KYC not approved'];
            }

            $provider = $locked->getDexpayProvider();
            $reference = 'WD-' . $locked->id . '-' . Str::random(8);
            $quote = $dexpay->quotePayout($locked->amount, $provider);

            if ($quote['estimated_net_amount'] < 1) {
                return ['success' => false, 'error' => 'Les frais DexPay dépassent le montant du retrait.'];
            }

            // Passer en processing AVANT l'appel API (verrou tenu)
            $locked->update([
                'status' => 'processing',
                'dexpay_reference' => $reference,
            ]);

            // Rafraîchir $this pour refléter les changements
            $this->refresh();

            try {
                $result = $dexpay->createPayout(
                    phone: $locked->payout_account,
                    amount: $quote['estimated_net_amount'],
                    provider: $provider,
                    recipientName: $locked->tenant->name ?? 'Marchand PayTrack',
                    reference: $reference
                );

                $payoutId = $result['id'] ?? $result['data']['id'] ?? null;
                $payoutStatus = $result['status'] ?? $result['data']['status'] ?? 'pending';
                $payout = $result['data'] ?? $result;
                $actualNet = $payout['net_amount'] ?? $payout['amount_received'] ?? $payout['amount'] ?? null;
                $actualTotal = $payout['total_amount'] ?? null;
                $actualFees = $payout['fee_amount'] ?? $payout['fees'] ?? null;

                if (! is_numeric($actualTotal) && is_numeric($actualNet) && is_numeric($actualFees)) {
                    $actualTotal = (int) $actualNet + (int) $actualFees;
                }
                if (! is_numeric($actualTotal) || ! is_numeric($actualNet)) {
                    throw new \RuntimeException('Réponse payout DexPay incomplète : frais/net non vérifiables.');
                }

                $actualFees = (int) $actualTotal - (int) $actualNet;
                $locked->update([
                    'fees' => $actualFees,
                    'net_amount' => (int) $actualNet,
                ]);

                // Si payout synchrone (Wave/OM sont instantanés)
                if ($payoutStatus === 'completed') {
                    $locked->update([
                        'status' => 'completed',
                        'dexpay_payout_id' => $payoutId,
                        'processed_at' => now(),
                    ]);

                    // Débiter le wallet immédiatement
                    if ($locked->wallet) {
                        $locked->wallet->debit(
                        (int) $actualTotal,
                            "Retrait #{$locked->id} - {$locked->payout_method}",
                            $locked
                        );
                    }
                } else {
                    // Payout asynchrone - attendre webhook
                    $locked->update([
                        'dexpay_payout_id' => $payoutId,
                    ]);
                }

                return [
                    'success' => true,
                    'transactionId' => $payoutId,
                    'reference' => $reference,
                    'status' => $payoutStatus,
                ];

            } catch (\Exception $e) {
                // Remettre en pending si l'appel API échoue
                $locked->update([
                    'status' => 'pending',
                    'admin_notes' => 'CashOut DexPay échoué: ' . $e->getMessage(),
                ]);

                return [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        });
    }

    public function approve(User $admin, string $payoutRef = null): void
    {
        $this->update([
            'status' => 'completed',
            'processed_by' => $admin->id,
            'processed_at' => now(),
            'payout_reference' => $payoutRef,
        ]);

        $this->wallet->debit($this->walletDebitAmount(), "Retrait #{$this->id}", $this);
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

    public function walletDebitAmount(): int
    {
        return $this->net_amount !== null && $this->fees !== null
            ? (int) $this->net_amount + (int) $this->fees
            : (int) $this->amount;
    }
}
