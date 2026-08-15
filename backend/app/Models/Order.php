<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Order extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'shop_id', 'client_id', 'created_by', 'reference', 'qr_uuid',
        'subtotal', 'discount', 'total_amount', 'paid_amount', 'remaining_amount',
        'payment_mode', 'status', 'payment_status', 'order_date', 'delivery_date',
        'notes', 'paytech_payment_ref',
    ];

    protected $casts = [
        'subtotal' => 'integer',
        'discount' => 'integer',
        'total_amount' => 'integer',
        'paid_amount' => 'integer',
        'remaining_amount' => 'integer',
        'order_date' => 'date',
        'delivery_date' => 'date',
    ];

    public function client() { return $this->belongsTo(Client::class); }
    public function shop() { return $this->belongsTo(Shop::class); }
    public function createdBy() { return $this->belongsTo(User::class, 'created_by'); }
    public function items() { return $this->hasMany(OrderItem::class); }
    public function payments() { return $this->hasMany(OrderPayment::class); }
    public function stockMovements() { return $this->morphMany(StockMovement::class, 'moveable'); }

    public function recalculateTotals(): void
    {
        $this->subtotal = $this->items->sum('total_price');
        $this->total_amount = max(0, $this->subtotal - $this->discount);
        $this->paid_amount = $this->payments->sum('amount');
        $this->remaining_amount = max(0, $this->total_amount - $this->paid_amount);
        $this->payment_status = match(true) {
            $this->remaining_amount === 0 => 'paid',
            $this->paid_amount > 0 => 'partial',
            default => 'unpaid',
        };
        $this->save();
    }

    public function canDeliver(): bool
    {
        return in_array($this->status, ['confirmed', 'preparing', 'ready']);
    }

    public function isPaid(): bool { return $this->payment_status === 'paid'; }

    public static function generateReference(?int $tenantId = null): string
    {
        // Format: CMD-{tenant}-{YYYYMM}-{0001} pour unicité globale
        $t = $tenantId ? str_pad($tenantId, 3, '0', STR_PAD_LEFT) : '000';
        $prefix = "CMD-{$t}-" . date('Ym') . '-';
        $query = static::withoutGlobalScopes()->where('reference', 'like', $prefix . '%');
        $last = $query->orderByDesc('id')->first();
        $num = $last ? (int) substr($last->reference, -4) + 1 : 1;
        return $prefix . str_pad($num, 4, '0', STR_PAD_LEFT);
    }

    protected static function booted(): void
    {
        static::creating(function ($order) {
            $order->qr_uuid = $order->qr_uuid ?? Str::uuid();
            $order->reference = $order->reference ?? static::generateReference($order->tenant_id);
        });
    }
}
