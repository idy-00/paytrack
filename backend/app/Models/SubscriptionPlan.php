<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name', 'slug', 'price_monthly', 'price_yearly',
        'max_products', 'max_users', 'multi_shop',
        'supplier_orders', 'advanced_stock', 'features', 'is_active',
    ];

    protected $casts = [
        'price_monthly' => 'integer',
        'price_yearly' => 'integer',
        'max_products' => 'integer',
        'max_users' => 'integer',
        'multi_shop' => 'boolean',
        'supplier_orders' => 'boolean',
        'advanced_stock' => 'boolean',
        'features' => 'array',
        'is_active' => 'boolean',
    ];

    public function subscriptions() { return $this->hasMany(Subscription::class, 'plan_id'); }

    public function scopeActive($q) { return $q->where('is_active', true); }

    public function hasUnlimitedProducts(): bool { return $this->max_products === null; }
}
