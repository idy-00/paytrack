<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tenants (companies/businesses)
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('SN');
            $table->string('currency')->default('XOF');
            $table->boolean('is_active')->default(true);
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Add tenant_id to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete()->after('id');
            $table->string('phone')->nullable()->after('email');
            $table->string('avatar')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_active_at')->nullable();
        });

        // Shops (boutiques) — one tenant can have multiple shops
        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index('tenant_id');
        });

        // Clients (customers)
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->string('full_name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->string('id_type')->nullable();   // CNI, passeport, etc.
            $table->string('id_number')->nullable();
            $table->string('id_photo_path')->nullable(); // encrypted separately
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('tenant_id');
            $table->index(['tenant_id', 'phone']);
        });

        // Articles / products
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('reference')->nullable();
            $table->unsignedBigInteger('price');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index('tenant_id');
        });

        // Sales (ventes par tranche)
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->foreignId('article_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('reference')->unique();
            $table->uuid('qr_uuid')->unique();
            $table->string('article_name'); // denormalized snapshot
            $table->unsignedBigInteger('total_amount');
            $table->unsignedBigInteger('down_payment')->default(0);
            $table->unsignedBigInteger('paid_amount')->default(0);
            $table->unsignedBigInteger('remaining_amount');
            $table->unsignedTinyInteger('installment_count');
            $table->unsignedBigInteger('installment_amount');
            $table->enum('frequency', ['hebdomadaire', 'bimestriel', 'mensuel', 'trimestriel'])->default('mensuel');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['actif', 'retard', 'litige', 'solde', 'annule'])->default('actif');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('tenant_id');
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'client_id']);
        });

        // Installment schedule
        Schema::create('sale_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('installment_number');
            $table->date('due_date');
            $table->unsignedBigInteger('amount');
            $table->enum('status', ['en_attente', 'paye', 'retard', 'partiel'])->default('en_attente');
            $table->date('paid_date')->nullable();
            $table->unsignedBigInteger('paid_amount')->default(0);
            $table->timestamps();
            $table->index(['tenant_id', 'sale_id']);
            $table->index(['tenant_id', 'due_date']);
        });

        // Payments received
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained()->restrictOnDelete();
            $table->foreignId('sale_schedule_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->string('receipt_number')->unique();
            $table->unsignedBigInteger('amount');
            $table->date('payment_date');
            $table->enum('payment_type', ['acompte', 'tranche', 'solde', 'partiel'])->default('tranche');
            $table->enum('payment_method', ['especes', 'wave', 'orange_money', 'free_money', 'virement', 'cheque'])->default('especes');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('tenant_id');
            $table->index(['tenant_id', 'sale_id']);
        });

        // Audit log (append-only by policy — no updates/deletes allowed)
        // Supplemented by spatie/activitylog; this table tracks business events
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event');          // payment.created, sale.updated, user.login, etc.
            $table->string('auditable_type')->nullable();
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
            // No updated_at — append-only
            $table->index(['tenant_id', 'event']);
            $table->index(['auditable_type', 'auditable_id']);
        });

        // Data retention policy per tenant
        Schema::create('data_retention_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('active_retention_years')->default(10);
            $table->unsignedInteger('archive_retention_years')->default(5);
            $table->timestamp('last_cleanup_at')->nullable();
            $table->timestamps();
            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_retention_policies');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('sale_schedules');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('articles');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('shops');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['tenant_id', 'phone', 'avatar', 'is_active', 'last_active_at']);
        });
        Schema::dropIfExists('tenants');
    }
};
