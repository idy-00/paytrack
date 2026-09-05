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
                'description' => 'Petits commerçants, artisans, indépendants et microentreprises',
                'price_daily' => 100,
                'price_weekly' => 500,
                'price_monthly' => 2000,
                'price_quarterly' => 5500,
                'price_yearly' => 20000,
                'max_products' => 50,
                'max_users' => 1,
                'multi_shop' => false,
                'supplier_orders' => false,
                'advanced_stock' => false,
                'features' => [
                    'encaissements' => true,
                    'paiements' => true,
                    'historique' => true,
                    'creances_dettes' => true,
                    'echeances' => true,
                    'recus_numeriques' => true,
                    'factures_simples' => true,
                    'statut_paye_impaye' => true,
                    'tableau_bord_simple' => true,
                    'export_pdf' => true,
                ],
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'TPE, boutiques, prestataires et petites entreprises',
                'price_daily' => 250,
                'price_weekly' => 1250,
                'price_monthly' => 5000,
                'price_quarterly' => 13500,
                'price_yearly' => 50000,
                'max_products' => 500,
                'max_users' => 3,
                'multi_shop' => false,
                'supplier_orders' => false,
                'advanced_stock' => true,
                'features' => [
                    'encaissements' => true,
                    'paiements' => true,
                    'historique' => true,
                    'creances_dettes' => true,
                    'echeances' => true,
                    'recus_numeriques' => true,
                    'factures_simples' => true,
                    'statut_paye_impaye' => true,
                    'tableau_bord_simple' => true,
                    'export_pdf' => true,
                    'base_clients' => true,
                    'factures_personnalisees' => true,
                    'numerotation_auto' => true,
                    'suivi_impayes' => true,
                    'relances_alertes' => true,
                    'rapports_stats' => true,
                    'export_excel' => true,
                    'multi_utilisateurs' => true,
                    'sauvegarde_avancee' => true,
                ],
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'description' => 'PME et entreprises avec plusieurs collaborateurs',
                'price_daily' => 500,
                'price_weekly' => 2500,
                'price_monthly' => 10000,
                'price_quarterly' => 27000,
                'price_yearly' => 100000,
                'max_products' => null,
                'max_users' => 5,
                'multi_shop' => true,
                'supplier_orders' => true,
                'advanced_stock' => true,
                'features' => [
                    'encaissements' => true,
                    'paiements' => true,
                    'historique' => true,
                    'creances_dettes' => true,
                    'echeances' => true,
                    'recus_numeriques' => true,
                    'factures_simples' => true,
                    'statut_paye_impaye' => true,
                    'tableau_bord_simple' => true,
                    'export_pdf' => true,
                    'base_clients' => true,
                    'factures_personnalisees' => true,
                    'numerotation_auto' => true,
                    'suivi_impayes' => true,
                    'relances_alertes' => true,
                    'rapports_stats' => true,
                    'export_excel' => true,
                    'multi_utilisateurs' => true,
                    'sauvegarde_avancee' => true,
                    'multi_utilisateurs_avance' => true,
                    'gestion_roles' => true,
                    'volume_eleve' => true,
                    'tableaux_bord_avances' => true,
                    'reporting_financier' => true,
                    'analyse_encaissements' => true,
                    'personnalisation_entreprise' => true,
                    'archivage_avance' => true,
                    'assistance_prioritaire' => true,
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
