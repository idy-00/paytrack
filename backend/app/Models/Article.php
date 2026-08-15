<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;

class Article extends Model
{
    use SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'shop_id', 'name', 'category', 'reference',
        'price', 'stock', 'stock_reserved', 'stock_alert_threshold',
        'track_stock', 'description', 'is_active',
    ];

    protected $casts = [
        'price'     => 'integer',
        'stock'     => 'integer',
        'stock_reserved' => 'integer',
        'stock_alert_threshold' => 'integer',
        'track_stock' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function sales() { return $this->hasMany(Sale::class); }
    public function stockMovements() { return $this->hasMany(StockMovement::class); }

    public function scopeActive($query) { return $query->where('is_active', true); }

    public function availableStock(): int
    {
        return max(0, $this->stock - $this->stock_reserved);
    }

    public function isLowStock(): bool
    {
        return $this->track_stock && $this->stock <= $this->stock_alert_threshold;
    }

    public function isOutOfStock(): bool
    {
        return $this->track_stock && $this->stock <= 0;
    }
}
