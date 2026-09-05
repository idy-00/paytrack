<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Wallet extends Model
{
    protected $fillable = [
        'tenant_id', 'balance', 'pending_balance', 'held_balance', 'reserved_balance',
        'total_credits', 'total_debits',
    ];

    protected $casts = [
        'balance' => 'integer',
        'pending_balance' => 'integer',
        'held_balance' => 'integer',
        'reserved_balance' => 'integer',
        'total_credits' => 'integer',
        'total_debits' => 'integer',
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function transactions() { return $this->hasMany(WalletTransaction::class); }
    public function withdrawalRequests() { return $this->hasMany(WithdrawalRequest::class); }
    public function reserves() { return $this->hasMany(WalletReserve::class); }

    /**
     * Solde réellement retirable (exclut fonds retenus et réserves)
     */
    public function getWithdrawableBalanceAttribute(): int
    {
        return max(0, $this->balance - $this->reserved_balance);
    }

    /**
     * Solde total (disponible + en attente)
     */
    public function getTotalBalanceAttribute(): int
    {
        return $this->balance + $this->held_balance;
    }

    /**
     * Crédit immédiat (paiements mobile money : Wave, Orange Money)
     * Comportement inchangé par rapport à l'existant
     */
    public function credit(int $amount, string $description, $transactionable = null, string $dexpayId = null, string $paymentMethod = 'mobile_money'): WalletTransaction
    {
        return DB::transaction(function () use ($amount, $description, $transactionable, $dexpayId, $paymentMethod) {
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
                'payment_method' => $paymentMethod,
                'release_status' => 'immediate',
                'dexpay_transaction_id' => $dexpayId,
                'transactionable_type' => $transactionable ? get_class($transactionable) : null,
                'transactionable_id' => $transactionable?->id,
            ]);
        });
    }

    /**
     * Crédit avec rétention (paiements carte)
     * Fonds indisponibles pendant un délai configurable
     *
     * ATTENTION: Les valeurs par défaut sont des SUPPOSITIONS.
     * Contacter DexPay pour confirmer les vrais pourcentages/délais.
     *
     * Configuration via config/services.php > dexpay > card_release
     */
    public function creditHeld(
        int $amount,
        string $description,
        $transactionable = null,
        string $dexpayId = null,
        ?int $partialReleaseHours = null,
        ?int $fullReleaseHours = null,
        ?int $partialPercent = null
    ): WalletTransaction {
        // Lire config ou utiliser défauts (À CONFIRMER AVEC DEXPAY)
        $partialReleaseHours = $partialReleaseHours ?? config('services.dexpay.card_release.partial_hours', 72);
        $fullReleaseHours = $fullReleaseHours ?? config('services.dexpay.card_release.full_hours', 168);
        $partialPercent = $partialPercent ?? config('services.dexpay.card_release.partial_percent', 80);
        return DB::transaction(function () use ($amount, $description, $transactionable, $dexpayId, $partialReleaseHours, $fullReleaseHours, $partialPercent) {
            $this->lockForUpdate();

            // Les fonds vont dans held_balance, pas balance
            $this->increment('held_balance', $amount);
            $this->increment('total_credits', $amount);
            $this->refresh();

            // Date de disponibilité = délai partiel (72h)
            $availableAt = now()->addHours($partialReleaseHours);

            return $this->transactions()->create([
                'tenant_id' => $this->tenant_id,
                'type' => 'credit',
                'amount' => $amount,
                'balance_after' => $this->balance, // Solde disponible inchangé
                'description' => $description,
                'payment_method' => 'card',
                'release_status' => 'held',
                'available_at' => $availableAt,
                'held_amount' => $amount,
                'released_amount' => 0,
                'dexpay_transaction_id' => $dexpayId,
                'transactionable_type' => $transactionable ? get_class($transactionable) : null,
                'transactionable_id' => $transactionable?->id,
            ]);
        });
    }

    /**
     * Libérer les fonds retenus d'une transaction carte
     * Appelé par le job planifié ou manuellement
     *
     * @param WalletTransaction $transaction Transaction à libérer
     * @param int|null $amount Montant à libérer (null = tout le reste)
     * @param bool $isFinal Est-ce la libération finale ?
     */
    public function releaseFunds(WalletTransaction $transaction, ?int $amount = null, bool $isFinal = false): void
    {
        if ($transaction->release_status === 'released') {
            return; // Déjà libéré
        }

        DB::transaction(function () use ($transaction, $amount, $isFinal) {
            $this->lockForUpdate();
            $transaction->lockForUpdate();

            $remainingHeld = $transaction->held_amount - $transaction->released_amount;
            $toRelease = $amount ?? $remainingHeld;
            $toRelease = min($toRelease, $remainingHeld);

            if ($toRelease <= 0) {
                return;
            }

            // Transférer de held_balance vers balance
            $this->decrement('held_balance', $toRelease);
            $this->increment('balance', $toRelease);
            $this->refresh();

            // Mettre à jour la transaction
            $transaction->increment('released_amount', $toRelease);
            $newStatus = $isFinal || $transaction->released_amount >= $transaction->held_amount
                ? 'released'
                : 'partial';

            $transaction->update([
                'release_status' => $newStatus,
                'released_at' => $newStatus === 'released' ? now() : $transaction->released_at,
                'balance_after' => $this->balance,
            ]);
        });
    }

    /**
     * Débit standard (retrait, remboursement)
     */
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
                'release_status' => 'immediate',
                'transactionable_type' => $transactionable ? get_class($transactionable) : null,
                'transactionable_id' => $transactionable?->id,
            ]);
        });
    }

    /**
     * Débit forcé (chargeback, fraude)
     * Peut amener le solde à un montant négatif
     */
    public function forceDebit(int $amount, string $description, string $reason, $transactionable = null): WalletTransaction
    {
        return DB::transaction(function () use ($amount, $description, $reason, $transactionable) {
            $this->lockForUpdate();

            // Pas de vérification de solde - on débite même si ça devient négatif
            $this->decrement('balance', $amount);
            $this->increment('total_debits', $amount);
            $this->refresh();

            return $this->transactions()->create([
                'tenant_id' => $this->tenant_id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => $this->balance,
                'description' => $description,
                'release_status' => 'immediate',
                'special_type' => $reason, // chargeback, fraud, reserve_conversion
                'transactionable_type' => $transactionable ? get_class($transactionable) : null,
                'transactionable_id' => $transactionable?->id,
            ]);
        });
    }

    /**
     * Appliquer une réserve de garantie (retenue par DexPay)
     */
    public function applyReserve(int $amount, string $reason, ?User $admin = null, ?string $reference = null, ?string $notes = null): WalletReserve
    {
        return DB::transaction(function () use ($amount, $reason, $admin, $reference, $notes) {
            $this->lockForUpdate();
            $this->increment('reserved_balance', $amount);
            $this->refresh();

            return $this->reserves()->create([
                'tenant_id' => $this->tenant_id,
                'amount' => $amount,
                'reason' => $reason,
                'reference' => $reference,
                'status' => 'active',
                'created_by' => $admin?->id,
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Libérer une réserve de garantie
     */
    public function releaseReserve(WalletReserve $reserve, ?User $admin = null): void
    {
        if ($reserve->status !== 'active') {
            return;
        }

        DB::transaction(function () use ($reserve, $admin) {
            $this->lockForUpdate();
            $this->decrement('reserved_balance', $reserve->amount);
            $this->refresh();

            $reserve->update([
                'status' => 'released',
                'released_by' => $admin?->id,
                'released_at' => now(),
            ]);
        });
    }

    /**
     * Convertir une réserve en chargeback (débiter définitivement)
     */
    public function convertReserveToChargeback(WalletReserve $reserve, ?User $admin = null): WalletTransaction
    {
        if ($reserve->status !== 'active') {
            throw new \Exception('Réserve déjà traitée');
        }

        return DB::transaction(function () use ($reserve, $admin) {
            $this->lockForUpdate();

            // Retirer de la réserve
            $this->decrement('reserved_balance', $reserve->amount);

            // Débiter du solde (peut devenir négatif)
            $this->decrement('balance', $reserve->amount);
            $this->increment('total_debits', $reserve->amount);
            $this->refresh();

            $reserve->update([
                'status' => 'converted_to_chargeback',
                'released_by' => $admin?->id,
                'released_at' => now(),
            ]);

            return $this->transactions()->create([
                'tenant_id' => $this->tenant_id,
                'type' => 'debit',
                'amount' => $reserve->amount,
                'balance_after' => $this->balance,
                'description' => "Chargeback: {$reserve->reason}",
                'special_type' => 'chargeback',
                'release_status' => 'immediate',
            ]);
        });
    }

    /**
     * Vérifie si le retrait est possible (exclut fonds retenus et réserves)
     */
    public function canWithdraw(int $amount): bool
    {
        return $this->withdrawable_balance >= $amount;
    }

    /**
     * Transactions carte en attente de libération
     */
    public function heldTransactions()
    {
        return $this->transactions()
            ->where('payment_method', 'card')
            ->whereIn('release_status', ['held', 'partial'])
            ->orderBy('available_at');
    }
}
