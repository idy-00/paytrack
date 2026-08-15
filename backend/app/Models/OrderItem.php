<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'article_id', 'article_name',
        'quantity', 'unit_price', 'discount', 'total_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'integer',
        'discount' => 'integer',
        'total_price' => 'integer',
    ];

    public function order() { return $this->belongsTo(Order::class); }
    public function article() { return $this->belongsTo(Article::class); }
}
