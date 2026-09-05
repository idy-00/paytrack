<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('frequency', 32)->default('mensuel')->change();
            $table->unsignedSmallInteger('custom_interval_days')->nullable()->after('frequency');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('custom_interval_days');
            $table->enum('frequency', ['hebdomadaire', 'bimestriel', 'mensuel', 'trimestriel'])->default('mensuel')->change();
        });
    }
};
