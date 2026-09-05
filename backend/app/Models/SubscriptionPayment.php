<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPayment extends Model
{
    protected $fillable = [
        'subscription_id', 'amount', 'payment_method', 'payment_provider',
        'transaction_id', 'external_transaction_id', 'status', 'paid_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'paid_at' => 'datetime',
    ];

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }
}
