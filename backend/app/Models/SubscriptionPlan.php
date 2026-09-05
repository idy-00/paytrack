<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name', 'slug', 'description',
        'price_daily', 'price_weekly', 'price_monthly', 'price_quarterly', 'price_semiannual', 'price_yearly',
        'max_products', 'max_users', 'multi_shop',
        'supplier_orders', 'advanced_stock', 'features', 'is_active',
    ];

    protected $casts = [
        'price_daily' => 'integer',
        'price_weekly' => 'integer',
        'price_monthly' => 'integer',
        'price_quarterly' => 'integer',
        'price_semiannual' => 'integer',
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
