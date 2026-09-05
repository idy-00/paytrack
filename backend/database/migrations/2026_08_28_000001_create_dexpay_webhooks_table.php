<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dexpay_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->nullable()->index();
            $table->string('checkout_session_id')->nullable()->index();
            $table->string('reference')->nullable()->index();
            $table->string('event_type');
            $table->json('payload');
            $table->string('signature_received')->nullable();
            $table->boolean('signature_valid')->default(false);
            $table->string('ip_address')->nullable();
            $table->enum('processing_status', ['received', 'processed', 'failed'])->default('received');
            $table->text('processing_notes')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dexpay_webhooks');
    }
};
