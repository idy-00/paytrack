<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('shop_id')->constrained('users')->nullOnDelete();
            $table->index(['tenant_id', 'user_id']);
        });
        Schema::table('sales', function (Blueprint $table) {
            $table->enum('payment_mode', ['tranche', 'comptant'])->default('tranche')->after('remaining_amount');
        });
    }

    public function down(): void
    {
        Schema::table('sales', fn (Blueprint $table) => $table->dropColumn('payment_mode'));
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'user_id']);
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
