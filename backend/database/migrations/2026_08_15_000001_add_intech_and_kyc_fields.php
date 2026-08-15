<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            $table->string('intech_external_id')->nullable()->unique()->after('payout_reference');
            $table->string('intech_transaction_id')->nullable()->after('intech_external_id');
            $table->integer('fees')->default(0)->after('amount');
            $table->integer('net_amount')->nullable()->after('fees');
        });

        Schema::create('tenant_kyc_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->enum('document_type', ['identity', 'address_proof']);
            $table->string('file_path');
            $table->string('original_filename');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'document_type']);
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->enum('kyc_status', ['none', 'pending', 'approved', 'rejected'])
                ->default('none')
                ->after('settings');
            $table->timestamp('kyc_approved_at')->nullable()->after('kyc_status');
        });
    }

    public function down(): void
    {
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            $table->dropColumn(['intech_external_id', 'intech_transaction_id', 'fees', 'net_amount']);
        });

        Schema::dropIfExists('tenant_kyc_documents');

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['kyc_status', 'kyc_approved_at']);
        });
    }
};
