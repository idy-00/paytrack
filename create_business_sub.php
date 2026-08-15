<?php
require __DIR__ . '/backend/vendor/autoload.php';
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Tenant;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;

$tenant = Tenant::first();
echo "Tenant: {$tenant->name} (ID: {$tenant->id})\n";

$plan = SubscriptionPlan::where('slug', 'business')->first();
if (!$plan) {
    echo "Creating Business plan...\n";
    $plan = SubscriptionPlan::create([
        'name' => 'Business',
        'slug' => 'business',
        'price_monthly' => 13000,
        'price_yearly' => 130000,
        'max_products' => null,
        'max_users' => 5,
        'multi_shop' => true,
        'supplier_orders' => true,
        'advanced_stock' => true,
        'is_active' => true,
    ]);
}
echo "Plan: {$plan->name} (ID: {$plan->id})\n";

$sub = Subscription::updateOrCreate(
    ['tenant_id' => $tenant->id],
    [
        'plan_id' => $plan->id,
        'billing_cycle' => 'monthly',
        'status' => 'active',
        'current_period_start' => now(),
        'current_period_end' => now()->addMonth(),
    ]
);
echo "Subscription: status={$sub->status}, plan_id={$sub->plan_id}\n";
echo "Done! User now has Business plan.\n";
