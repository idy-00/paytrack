<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SubscriptionInvoice extends Model
{
    protected $fillable = [
        'tenant_id', 'subscription_id', 'invoice_number', 'amount',
        'status', 'payment_reference', 'due_date', 'paid_at', 'metadata',
    ];

    protected $casts = [
        'amount' => 'integer',
        'due_date' => 'datetime',
        'paid_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function subscription() { return $this->belongsTo(Subscription::class); }

    public function isPaid(): bool { return $this->status === 'paid'; }
    public function isPending(): bool { return $this->status === 'pending'; }

    public function markPaid(?string $paymentReference = null): void
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_reference' => $paymentReference,
        ]);
    }

    public static function generateNumber(): string
    {
        return 'INV-' . now()->format('Ym') . '-' . Str::ulid();
    }
}
