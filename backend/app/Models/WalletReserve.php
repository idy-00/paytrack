<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalletReserve extends Model
{
    protected $fillable = [
        'wallet_id', 'tenant_id', 'amount', 'reason', 'reference',
        'status', 'created_by', 'released_by', 'released_at', 'notes',
    ];

    protected $casts = [
        'amount' => 'integer',
        'released_at' => 'datetime',
    ];

    public function wallet() { return $this->belongsTo(Wallet::class); }
    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function createdBy() { return $this->belongsTo(User::class, 'created_by'); }
    public function releasedBy() { return $this->belongsTo(User::class, 'released_by'); }

    public function isActive(): bool { return $this->status === 'active'; }
    public function isReleased(): bool { return $this->status === 'released'; }
    public function isChargeback(): bool { return $this->status === 'converted_to_chargeback'; }

    /**
     * Scope : réserves actives
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
