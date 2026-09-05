<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            $table->string('dexpay_reference')->nullable()->unique()->after('payout_reference');
            $table->string('dexpay_payout_id')->nullable()->unique()->after('dexpay_reference');
        });
    }

    public function down(): void
    {
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            $table->dropUnique(['dexpay_reference']);
            $table->dropUnique(['dexpay_payout_id']);
            $table->dropColumn(['dexpay_reference', 'dexpay_payout_id']);
        });
    }
};
