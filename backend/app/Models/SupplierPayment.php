<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

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
        return 'SP-' . now()->format('Ym') . '-' . Str::ulid();
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
