<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'shop_id', 'created_by', 'reference',
        'inventory_date', 'status', 'notes',
    ];

    protected $casts = [
        'inventory_date' => 'date',
    ];

    public function shop() { return $this->belongsTo(Shop::class); }
    public function createdBy() { return $this->belongsTo(User::class, 'created_by'); }
    public function items() { return $this->hasMany(InventoryItem::class); }
    public function stockMovements() { return $this->morphMany(StockMovement::class, 'moveable'); }

    public function isInProgress(): bool { return $this->status === 'in_progress'; }
    public function isCompleted(): bool { return $this->status === 'completed'; }

    public function complete(): void
    {
        foreach ($this->items as $item) {
            if ($item->difference !== 0) {
                StockMovement::record(
                    $item->article,
                    'adjustment',
                    $item->difference,
                    'inventory',
                    $this,
                    auth()->id(),
                    $this->shop_id,
                    "Inventaire #{$this->reference}: ajustement de {$item->difference}"
                );
            }
        }
        $this->update(['status' => 'completed']);
    }

    public static function generateReference(?int $tenantId = null): string
    {
        $t = $tenantId ? str_pad($tenantId, 3, '0', STR_PAD_LEFT) : '000';
        $prefix = "INV-{$t}-" . date('Ym') . '-';
        $last = static::withoutGlobalScopes()->where('reference', 'like', $prefix . '%')
            ->orderByDesc('id')->first();
        $num = $last ? (int) substr($last->reference, -4) + 1 : 1;
        return $prefix . str_pad($num, 4, '0', STR_PAD_LEFT);
    }

    protected static function booted(): void
    {
        static::creating(function ($inv) {
            $inv->reference = $inv->reference ?? static::generateReference($inv->tenant_id);
        });
    }
}
