<?php

namespace App\Http\Controllers\Api\Webhook;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Services\IntechService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IntechWebhookController extends Controller
{
    public function __construct(private IntechService $intech) {}

    public function __invoke(Request $request)
    {
        $payload = $request->all();
        $signature = $request->header('X-Intech-Signature', '');

        Log::info('Intech webhook received', [
            'payload' => $payload,
            'signature_present' => !empty($signature),
        ]);

        if (!$this->intech->verifyCallbackSignature($payload, $signature)) {
            Log::warning('Intech webhook invalid signature', ['payload' => $payload]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $externalId = $payload['externalTransactionId'] ?? null;
        $transactionId = $payload['transactionId'] ?? null;
        $status = $payload['status'] ?? null;

        if (!$externalId) {
            return response()->json(['error' => 'Missing externalTransactionId'], 400);
        }

        $withdrawal = WithdrawalRequest::where('intech_external_id', $externalId)->first();

        if (!$withdrawal) {
            Log::warning('Intech webhook: withdrawal not found', ['externalId' => $externalId]);
            return response()->json(['error' => 'Withdrawal not found'], 404);
        }

        if ($withdrawal->status !== 'processing') {
            Log::info('Intech webhook: withdrawal already processed', [
                'externalId' => $externalId,
                'currentStatus' => $withdrawal->status,
            ]);
            return response()->json(['message' => 'Already processed']);
        }

        DB::transaction(function () use ($withdrawal, $transactionId, $status, $payload) {
            $withdrawal->lockForUpdate();

            if ($withdrawal->status !== 'processing') {
                return;
            }

            if ($status === 'SUCCESS' || $status === 'COMPLETED') {
                $withdrawal->update([
                    'status' => 'completed',
                    'intech_transaction_id' => $transactionId,
                    'payout_reference' => $transactionId,
                    'processed_at' => now(),
                    'admin_notes' => 'CashOut automatique Intech réussi',
                ]);

                $withdrawal->wallet->debit(
                    $withdrawal->amount,
                    "Retrait #{$withdrawal->id} - CashOut Intech",
                    $withdrawal
                );

                Log::info('Intech CashOut success', [
                    'withdrawalId' => $withdrawal->id,
                    'transactionId' => $transactionId,
                    'amount' => $withdrawal->amount,
                ]);
            } elseif ($status === 'FAILED' || $status === 'REJECTED') {
                $errorMessage = $payload['message'] ?? $payload['error'] ?? 'CashOut échoué';

                $withdrawal->update([
                    'status' => 'pending',
                    'intech_transaction_id' => $transactionId,
                    'admin_notes' => "CashOut auto échoué: {$errorMessage}. En attente traitement manuel.",
                ]);

                Log::warning('Intech CashOut failed', [
                    'withdrawalId' => $withdrawal->id,
                    'error' => $errorMessage,
                ]);
            }
        });

        return response()->json(['message' => 'Webhook processed']);
    }
}
