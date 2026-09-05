<?php

namespace App\Jobs;

use App\Models\WalletTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job planifié pour libérer les fonds carte retenus
 *
 * Règles de libération :
 * - 72h après paiement : 80% des fonds deviennent disponibles
 * - 7j (168h) après paiement : 100% des fonds disponibles
 *
 * À exécuter quotidiennement via scheduler : schedule:run
 */
class ReleaseHeldCardFunds implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('ReleaseHeldCardFunds: Début du traitement');

        $partialReleased = 0;
        $fullyReleased = 0;

        // 1. Libération partielle (72h) - 80% des fonds
        $partialTransactions = WalletTransaction::readyForPartialRelease()->get();

        foreach ($partialTransactions as $transaction) {
            try {
                $wallet = $transaction->wallet;
                if (!$wallet) continue;

                // Libérer 80% maintenant
                $toRelease = (int) floor($transaction->held_amount * 0.80);

                $wallet->releaseFunds($transaction, $toRelease, false);
                $partialReleased++;

                Log::info('ReleaseHeldCardFunds: Libération partielle', [
                    'transaction_id' => $transaction->id,
                    'tenant_id' => $transaction->tenant_id,
                    'amount_released' => $toRelease,
                    'remaining' => $transaction->fresh()->remaining_held,
                ]);

            } catch (\Exception $e) {
                Log::error('ReleaseHeldCardFunds: Erreur libération partielle', [
                    'transaction_id' => $transaction->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // 2. Libération totale (7j) - 100% des fonds restants
        $fullTransactions = WalletTransaction::readyForFullRelease()->get();

        foreach ($fullTransactions as $transaction) {
            try {
                $wallet = $transaction->wallet;
                if (!$wallet) continue;

                // Libérer tout le reste
                $wallet->releaseFunds($transaction, null, true);
                $fullyReleased++;

                Log::info('ReleaseHeldCardFunds: Libération totale', [
                    'transaction_id' => $transaction->id,
                    'tenant_id' => $transaction->tenant_id,
                    'total_amount' => $transaction->held_amount,
                ]);

            } catch (\Exception $e) {
                Log::error('ReleaseHeldCardFunds: Erreur libération totale', [
                    'transaction_id' => $transaction->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('ReleaseHeldCardFunds: Traitement terminé', [
            'partial_released' => $partialReleased,
            'fully_released' => $fullyReleased,
        ]);
    }
}
