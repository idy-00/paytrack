<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = [
        'inventory_id', 'article_id', 'expected_quantity',
        'counted_quantity', 'difference', 'notes',
    ];

    protected $casts = [
        'expected_quantity' => 'integer',
        'counted_quantity' => 'integer',
        'difference' => 'integer',
    ];

    public function inventory() { return $this->belongsTo(Inventory::class); }
    public function article() { return $this->belongsTo(Article::class); }

    protected static function booted(): void
    {
        static::saving(function ($item) {
            $item->difference = $item->counted_quantity - $item->expected_quantity;
        });
    }
}
