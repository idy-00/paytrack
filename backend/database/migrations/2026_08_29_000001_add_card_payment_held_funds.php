<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ajouter champs pour fonds retenus sur wallet
        Schema::table('wallets', function (Blueprint $table) {
            // Fonds carte en attente de libération (72h puis 7j)
            $table->integer('held_balance')->default(0)->after('pending_balance');
            // Réserve de garantie (retenue DexPay pour risque/contestations)
            $table->integer('reserved_balance')->default(0)->after('held_balance');
        });

        // Ajouter champs pour distinguer paiements carte vs mobile money
        Schema::table('wallet_transactions', function (Blueprint $table) {
            // Méthode de paiement : wave, orange_money, card, etc.
            $table->string('payment_method', 30)->nullable()->after('paytech_transaction_id');
            // Statut de libération : immediate (mobile money), held (carte en attente), released (carte libérée)
            $table->enum('release_status', ['immediate', 'held', 'partial', 'released'])->default('immediate')->after('payment_method');
            // Date à laquelle les fonds deviennent disponibles (null = immédiat)
            $table->timestamp('available_at')->nullable()->after('release_status');
            // Date de libération effective
            $table->timestamp('released_at')->nullable()->after('available_at');
            // Montant initial retenu (avant libération progressive)
            $table->integer('held_amount')->default(0)->after('released_at');
            // Montant déjà libéré
            $table->integer('released_amount')->default(0)->after('held_amount');
            // Référence DexPay (renommer paytech pour clarté)
            $table->string('dexpay_transaction_id', 100)->nullable()->after('released_amount');
            // Type d'opération spéciale : chargeback, reserve, release
            $table->string('special_type', 30)->nullable()->after('dexpay_transaction_id');
        });

        // Table pour les réserves de garantie (historique)
        Schema::create('wallet_reserves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->onDelete('cascade');
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->integer('amount');
            $table->string('reason'); // dexpay_hold, chargeback_risk, fraud_investigation
            $table->string('reference')->nullable(); // Référence DexPay ou interne
            $table->enum('status', ['active', 'released', 'converted_to_chargeback'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('released_by')->nullable()->constrained('users');
            $table->timestamp('released_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_reserves');

        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropColumn([
                'payment_method', 'release_status', 'available_at', 'released_at',
                'held_amount', 'released_amount', 'dexpay_transaction_id', 'special_type'
            ]);
        });

        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn(['held_balance', 'reserved_balance']);
        });
    }
};
