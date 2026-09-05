<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL ne permet pas de modifier directement un ENUM
        // On doit recréer la colonne
        Schema::table('subscriptions', function (Blueprint $table) {
            // Ajouter une colonne temporaire
            $table->string('billing_cycle_new', 20)->default('monthly')->after('plan_id');
        });

        // Copier les données
        DB::statement("UPDATE subscriptions SET billing_cycle_new = billing_cycle");

        // Supprimer l'ancienne colonne
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('billing_cycle');
        });

        // Renommer la nouvelle
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->renameColumn('billing_cycle_new', 'billing_cycle');
        });

        // Note: On utilise maintenant un string au lieu d'un ENUM pour plus de flexibilité
        // Valeurs supportées: daily, weekly, monthly, quarterly, semiannual, yearly
    }

    public function down(): void
    {
        // Retour à l'ENUM original si besoin
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('billing_cycle_old', 20)->default('monthly')->after('plan_id');
        });

        DB::statement("UPDATE subscriptions SET billing_cycle_old = CASE
            WHEN billing_cycle IN ('monthly', 'yearly') THEN billing_cycle
            ELSE 'monthly'
        END");

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('billing_cycle');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->renameColumn('billing_cycle_old', 'billing_cycle');
        });
    }
};
