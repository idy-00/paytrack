<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'tenant_id', 'wallet_id', 'type', 'amount', 'balance_after',
        'description', 'reference',
        'transactionable_type', 'transactionable_id',
        // Nouveaux champs pour paiements carte
        'payment_method', 'release_status', 'available_at', 'released_at',
        'held_amount', 'released_amount', 'dexpay_transaction_id', 'special_type',
    ];

    protected $casts = [
        'amount' => 'integer',
        'balance_after' => 'integer',
        'held_amount' => 'integer',
        'released_amount' => 'integer',
        'available_at' => 'datetime',
        'released_at' => 'datetime',
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function wallet() { return $this->belongsTo(Wallet::class); }
    public function transactionable(): MorphTo { return $this->morphTo(); }

    public function isCredit(): bool { return $this->type === 'credit'; }
    public function isDebit(): bool { return $this->type === 'debit'; }

    /**
     * Est-ce un paiement carte avec fonds retenus ?
     */
    public function isHeld(): bool
    {
        return $this->payment_method === 'card' && in_array($this->release_status, ['held', 'partial']);
    }

    /**
     * Est-ce un paiement carte entièrement libéré ?
     */
    public function isReleased(): bool
    {
        return $this->release_status === 'released';
    }

    /**
     * Est-ce un paiement immédiatement disponible (mobile money) ?
     */
    public function isImmediate(): bool
    {
        return $this->release_status === 'immediate';
    }

    /**
     * Est-ce un chargeback ?
     */
    public function isChargeback(): bool
    {
        return $this->special_type === 'chargeback';
    }

    /**
     * Montant encore retenu (non libéré)
     */
    public function getRemainingHeldAttribute(): int
    {
        return max(0, ($this->held_amount ?? 0) - ($this->released_amount ?? 0));
    }

    /**
     * Prêt pour libération partielle (72h) ?
     */
    public function isReadyForPartialRelease(): bool
    {
        return $this->isHeld()
            && $this->available_at
            && $this->available_at->isPast()
            && $this->release_status === 'held';
    }

    /**
     * Prêt pour libération totale (7j) ?
     */
    public function isReadyForFullRelease(): bool
    {
        if (!$this->isHeld() || !$this->available_at) {
            return false;
        }

        // 7 jours = 168h après le paiement (96h après les 72h initiaux)
        $fullReleaseAt = $this->created_at->addHours(168);
        return $fullReleaseAt->isPast() && $this->release_status !== 'released';
    }

    /**
     * Scope : transactions carte en attente de libération partielle
     */
    public function scopeReadyForPartialRelease($query)
    {
        return $query->where('payment_method', 'card')
            ->where('release_status', 'held')
            ->whereNotNull('available_at')
            ->where('available_at', '<=', now());
    }

    /**
     * Scope : transactions carte en attente de libération totale
     */
    public function scopeReadyForFullRelease($query)
    {
        return $query->where('payment_method', 'card')
            ->where('release_status', 'partial')
            ->where('created_at', '<=', now()->subHours(168));
    }
}
