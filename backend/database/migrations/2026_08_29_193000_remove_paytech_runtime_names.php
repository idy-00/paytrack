<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_invoices', function (Blueprint $table) {
            $table->renameColumn('paytech_ref', 'payment_reference');
        });

        Schema::table('order_payments', function (Blueprint $table) {
            $table->string('dexpay_transaction_id')->nullable()->unique()->after('paytech_transaction_id');
            $table->string('source', 20)->default('manual')->change();
        });
    }

    public function down(): void
    {
        Schema::table('order_payments', function (Blueprint $table) {
            $table->dropUnique(['dexpay_transaction_id']);
            $table->dropColumn('dexpay_transaction_id');
        });

        Schema::table('subscription_invoices', function (Blueprint $table) {
            $table->renameColumn('payment_reference', 'paytech_ref');
        });
    }
};
