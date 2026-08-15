<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class OrderPayment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'order_id', 'recorded_by', 'receipt_number', 'amount',
        'payment_date', 'payment_method', 'paytech_transaction_id', 'source', 'notes',
    ];

    protected $casts = [
        'amount' => 'integer',
        'payment_date' => 'date',
    ];

    public function order() { return $this->belongsTo(Order::class); }
    public function recordedBy() { return $this->belongsTo(User::class, 'recorded_by'); }

    public function isFromPaytech(): bool { return $this->source === 'paytech'; }

    public static function generateReceiptNumber(?int $tenantId = null): string
    {
        $t = $tenantId ? str_pad($tenantId, 3, '0', STR_PAD_LEFT) : '000';
        $prefix = "RCO-{$t}-" . date('Ym') . '-';
        $last = static::withoutGlobalScopes()->where('receipt_number', 'like', $prefix . '%')
            ->orderByDesc('id')->first();
        $num = $last ? (int) substr($last->receipt_number, -4) + 1 : 1;
        return $prefix . str_pad($num, 4, '0', STR_PAD_LEFT);
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
