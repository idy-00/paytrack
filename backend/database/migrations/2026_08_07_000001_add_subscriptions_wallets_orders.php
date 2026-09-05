<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── SUBSCRIPTION PLANS (ATAABA-defined) ──────────────────────
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');         // essentiel, pro, business
            $table->string('slug')->unique();
            $table->unsignedBigInteger('price_monthly');
            $table->unsignedBigInteger('price_yearly');
            $table->unsignedInteger('max_products')->nullable(); // null = unlimited
            $table->unsignedInteger('max_users');
            $table->boolean('multi_shop')->default(false);
            $table->boolean('supplier_orders')->default(false);
            $table->boolean('advanced_stock')->default(false);
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ─── TENANT SUBSCRIPTIONS ─────────────────────────────────────
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->enum('status', ['trial', 'active', 'expired', 'suspended', 'cancelled'])->default('trial');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->boolean('assisted_setup_requested')->default(false);
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        // ─── SUBSCRIPTION INVOICES ────────────────────────────────────
        Schema::create('subscription_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('invoice_number')->unique();
            $table->unsignedBigInteger('amount');
            $table->enum('status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->string('paytech_ref')->nullable();
            $table->timestamp('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        // ─── MERCHANT WALLETS ─────────────────────────────────────────
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('balance')->default(0);
            $table->unsignedBigInteger('pending_balance')->default(0);
            $table->unsignedBigInteger('total_credits')->default(0);
            $table->unsignedBigInteger('total_debits')->default(0);
            $table->timestamps();
            $table->unique('tenant_id');
        });

        // ─── WALLET TRANSACTIONS ──────────────────────────────────────
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['credit', 'debit']);
            $table->unsignedBigInteger('amount');
            $table->unsignedBigInteger('balance_after');
            $table->string('description');
            $table->string('reference')->nullable();
            $table->string('paytech_transaction_id')->nullable()->unique();
            // Same polymorphic relation as morphs('transactionable'), but MySQL
            // rejects Laravel's generated index name because it exceeds 64 chars.
            $table->string('transactionable_type');
            $table->unsignedBigInteger('transactionable_id');
            $table->index(['transactionable_type', 'transactionable_id'], 'wallet_tx_transactionable_idx');
            $table->timestamps();
            $table->index(['tenant_id', 'type']);
            $table->index('paytech_transaction_id');
        });

        // ─── WITHDRAWAL REQUESTS ──────────────────────────────────────
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->unsignedBigInteger('amount');
            $table->enum('payout_method', ['wave', 'orange_money', 'bank_transfer']);
            $table->string('payout_account'); // phone or bank details
            $table->enum('status', ['pending', 'processing', 'completed', 'rejected'])->default('pending');
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->string('payout_reference')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        // ─── PAYTECH WEBHOOKS LOG ─────────────────────────────────────
        Schema::create('paytech_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('paytech_transaction_id')->index();
            $table->string('event_type');
            $table->json('payload');
            $table->string('signature_received')->nullable();
            $table->boolean('signature_valid')->default(false);
            $table->string('ip_address', 45)->nullable();
            $table->enum('processing_status', ['received', 'processed', 'ignored', 'failed'])->default('received');
            $table->text('processing_notes')->nullable();
            $table->timestamps();
        });

        // ─── SUPPLIERS ────────────────────────────────────────────────
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index('tenant_id');
        });

        // ─── SUPPLIER ORDERS (purchase orders) ────────────────────────
        Schema::create('supplier_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('reference')->unique();
            $table->unsignedBigInteger('total_amount')->default(0);
            $table->unsignedBigInteger('paid_amount')->default(0);
            $table->unsignedBigInteger('remaining_amount')->default(0);
            $table->enum('status', ['draft', 'sent', 'partial_received', 'received', 'cancelled'])->default('draft');
            $table->date('order_date');
            $table->date('expected_date')->nullable();
            $table->date('received_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'status']);
        });

        // ─── SUPPLIER ORDER ITEMS ─────────────────────────────────────
        Schema::create('supplier_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('article_id')->nullable()->constrained()->nullOnDelete();
            $table->string('article_name');
            $table->unsignedInteger('quantity_ordered');
            $table->unsignedInteger('quantity_received')->default(0);
            $table->unsignedBigInteger('unit_price');
            $table->unsignedBigInteger('total_price');
            $table->timestamps();
        });

        // ─── SUPPLIER PAYMENTS ────────────────────────────────────────
        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->string('reference')->unique();
            $table->unsignedBigInteger('amount');
            $table->date('payment_date');
            $table->enum('payment_method', ['especes', 'wave', 'orange_money', 'virement', 'cheque']);
            $table->string('proof_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('tenant_id');
        });

        // ─── CUSTOMER ORDERS ──────────────────────────────────────────
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('reference')->unique();
            $table->uuid('qr_uuid')->unique();
            $table->unsignedBigInteger('subtotal')->default(0);
            $table->unsignedBigInteger('discount')->default(0);
            $table->unsignedBigInteger('total_amount');
            $table->unsignedBigInteger('paid_amount')->default(0);
            $table->unsignedBigInteger('remaining_amount');
            $table->enum('payment_mode', ['comptant', 'tranche'])->default('comptant');
            $table->enum('status', ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])->default('pending');
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->date('order_date');
            $table->date('delivery_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('paytech_payment_ref')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'payment_status']);
        });

        // ─── ORDER ITEMS ──────────────────────────────────────────────
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('article_id')->nullable()->constrained()->nullOnDelete();
            $table->string('article_name');
            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('unit_price');
            $table->unsignedBigInteger('discount')->default(0);
            $table->unsignedBigInteger('total_price');
            $table->timestamps();
        });

        // ─── ORDER PAYMENTS ───────────────────────────────────────────
        Schema::create('order_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('receipt_number')->unique();
            $table->unsignedBigInteger('amount');
            $table->date('payment_date');
            $table->enum('payment_method', ['especes', 'wave', 'orange_money', 'free_money', 'card', 'wizall', 'emoney']);
            $table->string('paytech_transaction_id')->nullable()->unique();
            $table->enum('source', ['manual', 'paytech'])->default('manual');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'order_id']);
        });

        // ─── STOCK MOVEMENTS ──────────────────────────────────────────
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['in', 'out', 'adjustment', 'reservation', 'release']);
            $table->integer('quantity'); // positive or negative
            $table->unsignedInteger('stock_before');
            $table->unsignedInteger('stock_after');
            $table->string('reason'); // supplier_receipt, sale, order, adjustment, inventory, return
            $table->morphs('moveable'); // order, sale, supplier_order, inventory
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'article_id']);
            $table->index(['tenant_id', 'type']);
        });

        // ─── INVENTORIES ──────────────────────────────────────────────
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('reference')->unique();
            $table->date('inventory_date');
            $table->enum('status', ['in_progress', 'completed', 'cancelled'])->default('in_progress');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('tenant_id');
        });

        // ─── INVENTORY ITEMS ──────────────────────────────────────────
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained()->cascadeOnDelete();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('expected_quantity');
            $table->unsignedInteger('counted_quantity');
            $table->integer('difference');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ─── UPDATE TENANTS - add subscription/config fields ──────────
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('phone');
            $table->string('wave_number')->nullable()->after('logo_path');
            $table->string('orange_money_number')->nullable()->after('wave_number');
            $table->json('settings')->nullable()->after('currency');
        });

        // ─── UPDATE ARTICLES - add stock tracking fields ──────────────
        Schema::table('articles', function (Blueprint $table) {
            $table->unsignedInteger('stock_reserved')->default(0)->after('stock');
            $table->unsignedInteger('stock_alert_threshold')->default(5)->after('stock_reserved');
            $table->boolean('track_stock')->default(true)->after('stock_alert_threshold');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['stock_reserved', 'stock_alert_threshold', 'track_stock']);
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['logo_path', 'wave_number', 'orange_money_number', 'settings']);
        });

        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventories');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('order_payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('supplier_payments');
        Schema::dropIfExists('supplier_order_items');
        Schema::dropIfExists('supplier_orders');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('paytech_webhooks');
        Schema::dropIfExists('withdrawal_requests');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('subscription_invoices');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_plans');
    }
};
