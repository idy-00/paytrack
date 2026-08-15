<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplierOrder extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'shop_id', 'supplier_id', 'created_by', 'reference',
        'total_amount', 'paid_amount', 'remaining_amount', 'status',
        'order_date', 'expected_date', 'received_date', 'notes',
    ];

    protected $casts = [
        'total_amount' => 'integer',
        'paid_amount' => 'integer',
        'remaining_amount' => 'integer',
        'order_date' => 'date',
        'expected_date' => 'date',
        'received_date' => 'date',
    ];

    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function shop() { return $this->belongsTo(Shop::class); }
    public function createdBy() { return $this->belongsTo(User::class, 'created_by'); }
    public function items() { return $this->hasMany(SupplierOrderItem::class); }
    public function payments() { return $this->hasMany(SupplierPayment::class); }
    public function stockMovements() { return $this->morphMany(StockMovement::class, 'moveable'); }

    public function recalculateTotals(): void
    {
        $this->total_amount = $this->items->sum('total_price');
        $this->paid_amount = $this->payments->sum('amount');
        $this->remaining_amount = max(0, $this->total_amount - $this->paid_amount);
        $this->save();
    }

    public function markReceived(): void
    {
        $this->update([
            'status' => 'received',
            'received_date' => now(),
        ]);
    }

    public static function generateReference(?int $tenantId = null): string
    {
        $t = $tenantId ? str_pad($tenantId, 3, '0', STR_PAD_LEFT) : '000';
        $prefix = "PO-{$t}-" . date('Ym') . '-';
        $last = static::withoutGlobalScopes()->where('reference', 'like', $prefix . '%')
            ->orderByDesc('id')->first();
        $num = $last ? (int) substr($last->reference, -4) + 1 : 1;
        return $prefix . str_pad($num, 4, '0', STR_PAD_LEFT);
    }

    protected static function booted(): void
    {
        static::creating(function ($order) {
            $order->reference = $order->reference ?? static::generateReference($order->tenant_id);
        });
    }
}
