<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionInvoice extends Model
{
    protected $fillable = [
        'tenant_id', 'subscription_id', 'invoice_number', 'amount',
        'status', 'paytech_ref', 'due_date', 'paid_at', 'metadata',
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

    public function markPaid(string $paytechRef = null): void
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
            'paytech_ref' => $paytechRef,
        ]);
    }

    public static function generateNumber(): string
    {
        $prefix = 'INV-' . date('Ym') . '-';
        $last = static::where('invoice_number', 'like', $prefix . '%')
            ->orderByDesc('id')->first();
        $num = $last ? (int) substr($last->invoice_number, -4) + 1 : 1;
        return $prefix . str_pad($num, 4, '0', STR_PAD_LEFT);
    }
}
