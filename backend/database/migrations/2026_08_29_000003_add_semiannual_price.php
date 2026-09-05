<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->integer('price_semiannual')->default(0)->after('price_quarterly');
        });

        // Calculer le prix semestriel = 6 * monthly avec 10% de réduction
        \DB::statement("UPDATE subscription_plans SET price_semiannual = ROUND(price_monthly * 6 * 0.9)");
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn('price_semiannual');
        });
    }
};
