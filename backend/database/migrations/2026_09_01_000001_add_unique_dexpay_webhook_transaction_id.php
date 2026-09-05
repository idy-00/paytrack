<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Les webhooks historiques pouvaient avoir une référence générique
        // (notamment "unknown"). Préserver les lignes existantes tout en
        // rendant les doublons uniques avant de poser la contrainte.
        $seen = [];
        DB::table('dexpay_webhooks')
            ->orderBy('id')
            ->select(['id', 'transaction_id'])
            ->each(function (object $webhook) use (&$seen): void {
                $transactionId = $webhook->transaction_id;
                if ($transactionId === null || $transactionId === '') {
                    return;
                }

                if (isset($seen[$transactionId])) {
                    DB::table('dexpay_webhooks')
                        ->where('id', $webhook->id)
                        ->update([
                            'transaction_id' => substr($transactionId, 0, 220) . '-legacy-' . $webhook->id,
                        ]);
                }

                $seen[$transactionId] = true;
            });

        Schema::table('dexpay_webhooks', function (Blueprint $table) {
            $table->unique('transaction_id', 'dexpay_webhooks_transaction_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('dexpay_webhooks', function (Blueprint $table) {
            $table->dropUnique('dexpay_webhooks_transaction_id_unique');
        });
    }
};
