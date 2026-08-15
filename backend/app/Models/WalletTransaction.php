<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'tenant_id', 'wallet_id', 'type', 'amount', 'balance_after',
        'description', 'reference', 'paytech_transaction_id',
        'transactionable_type', 'transactionable_id',
    ];

    protected $casts = [
        'amount' => 'integer',
        'balance_after' => 'integer',
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function wallet() { return $this->belongsTo(Wallet::class); }
    public function transactionable(): MorphTo { return $this->morphTo(); }

    public function isCredit(): bool { return $this->type === 'credit'; }
    public function isDebit(): bool { return $this->type === 'debit'; }
}
