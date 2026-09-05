<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class OrderPayment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'order_id', 'recorded_by', 'receipt_number', 'amount',
        'payment_date', 'payment_method', 'dexpay_transaction_id', 'source', 'notes',
    ];

    protected $casts = [
        'amount' => 'integer',
        'payment_date' => 'date',
    ];

    public function order() { return $this->belongsTo(Order::class); }
    public function recordedBy() { return $this->belongsTo(User::class, 'recorded_by'); }

    public function isFromDexpay(): bool { return $this->source === 'dexpay'; }

    public static function generateReceiptNumber(?int $tenantId = null): string
    {
        return 'RCO-' . now()->format('Ym') . '-' . Str::ulid();
    }

    protected static function booted(): void
    {
        static::creating(function ($payment) {
            $payment->receipt_number = $payment->receipt_number ?? static::generateReceiptNumber($payment->tenant_id);
        });
        static::created(function ($payment) {
            $payment->order->recalculateTotals();
        });
    }
}
