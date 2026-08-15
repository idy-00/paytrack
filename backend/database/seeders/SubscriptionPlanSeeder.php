<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Essentiel',
                'slug' => 'essentiel',
                'price_monthly' => 3000,
                'price_yearly' => 30000,
                'max_products' => 50,
                'max_users' => 1,
                'multi_shop' => false,
                'supplier_orders' => false,
                'advanced_stock' => false,
                'features' => [
                    'clients' => true,
                    'orders' => true,
                    'payments' => true,
                    'receipts' => true,
                    'basic_stock' => true,
                    'qr_codes' => true,
                ],
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'price_monthly' => 7500,
                'price_yearly' => 75000,
                'max_products' => 500,
                'max_users' => 3,
                'multi_shop' => false,
                'supplier_orders' => false,
                'advanced_stock' => true,
                'features' => [
                    'clients' => true,
                    'orders' => true,
                    'payments' => true,
                    'receipts' => true,
                    'basic_stock' => true,
                    'advanced_stock' => true,
                    'inventory' => true,
                    'deliveries' => true,
                    'customer_debts' => true,
                    'qr_codes' => true,
                    'exports' => true,
                ],
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'price_monthly' => 13000,
                'price_yearly' => 130000,
                'max_products' => null, // unlimited
                'max_users' => 5,
                'multi_shop' => true,
                'supplier_orders' => true,
                'advanced_stock' => true,
                'features' => [
                    'clients' => true,
                    'orders' => true,
                    'payments' => true,
                    'receipts' => true,
                    'basic_stock' => true,
                    'advanced_stock' => true,
                    'inventory' => true,
                    'deliveries' => true,
                    'customer_debts' => true,
                    'supplier_orders' => true,
                    'supplier_payments' => true,
                    'supplier_debts' => true,
                    'multi_shop' => true,
                    'advanced_reports' => true,
                    'qr_codes' => true,
                    'exports' => true,
                ],
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
