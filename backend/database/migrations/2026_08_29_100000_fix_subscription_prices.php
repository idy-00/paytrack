<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Prix officiels selon Tarification_PayTrack_sans_Wallet_avec_Facturation.docx
        $prices = [
            'essentiel' => [
                'price_daily' => 100,
                'price_weekly' => 500,
                'price_monthly' => 2000,
                'price_quarterly' => 5500,
                'price_semiannual' => 10800, // 6 mois = monthly * 6 * 0.9
                'price_yearly' => 20000,
            ],
            'pro' => [
                'price_daily' => 250,
                'price_weekly' => 1250,
                'price_monthly' => 5000,
                'price_quarterly' => 13500,
                'price_semiannual' => 27000,
                'price_yearly' => 50000,
            ],
            'business' => [
                'price_daily' => 500,
                'price_weekly' => 2500,
                'price_monthly' => 10000,
                'price_quarterly' => 27000,
                'price_semiannual' => 54000,
                'price_yearly' => 100000,
            ],
        ];

        foreach ($prices as $slug => $data) {
            DB::table('subscription_plans')
                ->where('slug', $slug)
                ->update($data);
        }
    }

    public function down(): void
    {
        // Pas de rollback - les anciens prix étaient faux
    }
};
