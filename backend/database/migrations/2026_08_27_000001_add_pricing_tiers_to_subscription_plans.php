<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->string('description')->nullable()->after('name');
            $table->integer('price_daily')->default(0)->after('slug');
            $table->integer('price_weekly')->default(0)->after('price_daily');
            $table->integer('price_quarterly')->default(0)->after('price_monthly');
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn(['description', 'price_daily', 'price_weekly', 'price_quarterly']);
        });
    }
};
