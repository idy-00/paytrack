<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class SupplierPayment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'supplier_order_id', 'recorded_by', 'reference',
        'amount', 'payment_date', 'payment_method', 'proof_path', 'notes',
    ];

    protected $casts = [
        'amount' => 'integer',
        'payment_date' => 'date',
    ];

    public function order() { return $this->belongsTo(SupplierOrder::class, 'supplier_order_id'); }
    public function recordedBy() { return $this->belongsTo(User::class, 'recorded_by'); }

    public static function generateReference(?int $tenantId = null): string
    {
        $t = $tenantId ? str_pad($tenantId, 3, '0', STR_PAD_LEFT) : '000';
        $prefix = "SP-{$t}-" . date('Ym') . '-';
        $last = static::withoutGlobalScopes()->where('reference', 'like', $prefix . '%')
            ->orderByDesc('id')->first();
        $num = $last ? (int) substr($last->reference, -4) + 1 : 1;
        return $prefix . str_pad($num, 4, '0', STR_PAD_LEFT);
    }

    protected static function booted(): void
    {
        static::creating(function ($payment) {
            $payment->reference = $payment->reference ?? static::generateReference($payment->tenant_id);
        });
        static::created(function ($payment) {
            $payment->order->recalculateTotals();
        });
    }
}
