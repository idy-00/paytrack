<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierOrderItem extends Model
{
    protected $fillable = [
        'supplier_order_id', 'article_id', 'article_name',
        'quantity_ordered', 'quantity_received', 'unit_price', 'total_price',
    ];

    protected $casts = [
        'quantity_ordered' => 'integer',
        'quantity_received' => 'integer',
        'unit_price' => 'integer',
        'total_price' => 'integer',
    ];

    public function order() { return $this->belongsTo(SupplierOrder::class, 'supplier_order_id'); }
    public function article() { return $this->belongsTo(Article::class); }

    public function isFullyReceived(): bool
    {
        return $this->quantity_received >= $this->quantity_ordered;
    }

    public function remainingToReceive(): int
    {
        return max(0, $this->quantity_ordered - $this->quantity_received);
    }
}
