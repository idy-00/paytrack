<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Notifications\AccountNotification;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $this->ensureMerchantWalletAccess($request);
        $tenant = $request->user()->tenant;
        $wallet = $tenant->getOrCreateWallet();

        // Transactions carte en attente de libération
        $heldTransactions = $wallet->heldTransactions()->get()->map(fn($tx) => [
            'id' => $tx->id,
            'amount' => $tx->held_amount,
            'released' => $tx->released_amount,
            'remaining' => $tx->remaining_held,
            'available_at' => $tx->available_at,
            'status' => $tx->release_status,
            'created_at' => $tx->created_at,
        ]);

        return response()->json([
            'wallet' => [
                'id' => $wallet->id,
                'balance' => $wallet->balance,
                'held_balance' => $wallet->held_balance,
                'reserved_balance' => $wallet->reserved_balance,
                'withdrawable_balance' => $wallet->withdrawable_balance,
                'total_balance' => $wallet->total_balance,
                'total_credits' => $wallet->total_credits,
                'total_debits' => $wallet->total_debits,
            ],
            'pending_withdrawals' => $wallet->withdrawalRequests()
                ->whereIn('status', ['pending', 'processing'])
                ->sum('amount'),
            'held_transactions' => $heldTransactions,
        ]);
    }

    public function transactions(Request $request)
    {
        $this->ensureMerchantWalletAccess($request);
        $wallet = $request->user()->tenant->wallet;

        if (!$wallet) {
            return response()->json(['data' => []]);
        }

        $transactions = $wallet->transactions()
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($transactions);
    }

    public function requestWithdrawal(Request $request)
    {
        $this->ensureMerchantWalletAccess($request);
        // Méthodes de payout supportées via DexPay
        // wave → wave_sn_payout (1.5%)
        // orange_money → om_sn_payout (1.4%)
        $validated = $request->validate([
            'amount' => 'required|integer|min:1000',
            'payout_method' => 'required|in:wave,orange_money',
            'payout_account' => ['required', 'string', 'max:20', 'regex:/^\+?[0-9]{9,15}$/'],
        ]);

        $tenant = $request->user()->tenant;

        if (!$tenant->canRequestWithdrawal()) {
            return response()->json([
                'message' => 'KYC non validé. Veuillez soumettre vos documents d\'identité.',
                'kyc_status' => $tenant->kyc_status,
            ], 403);
        }

        $wallet = $tenant->getOrCreateWallet();

        // Solde retirable = balance - reserved_balance
        $withdrawableBalance = $wallet->withdrawable_balance;

        if (!$wallet->canWithdraw($validated['amount'])) {
            return response()->json([
                'message' => 'Solde insuffisant',
                'balance' => $wallet->balance,
                'withdrawable' => $withdrawableBalance,
                'held' => $wallet->held_balance,
                'reserved' => $wallet->reserved_balance,
            ], 400);
        }

        $pendingTotal = $wallet->withdrawalRequests()
            ->whereIn('status', ['pending', 'processing'])
            ->sum('amount');

        $available = $withdrawableBalance - $pendingTotal;
        if ($available < $validated['amount']) {
            return response()->json([
                'message' => 'Solde disponible insuffisant (retraits en attente ou fonds retenus)',
                'available' => $available,
                'withdrawable' => $withdrawableBalance,
                'pending_withdrawals' => $pendingTotal,
            ], 400);
        }

        $withdrawal = WithdrawalRequest::create([
            'tenant_id' => $tenant->id,
            'wallet_id' => $wallet->id,
            'requested_by' => $request->user()->id,
            'amount' => $validated['amount'],
            'payout_method' => $validated['payout_method'],
            'payout_account' => $validated['payout_account'],
            'status' => 'pending',
        ]);

        $request->user()->notify(new AccountNotification(
            'Demande de retrait enregistrée',
            'Votre demande de retrait de ' . number_format($withdrawal->amount, 0, ',', ' ') . ' FCFA est en cours de traitement.',
            'withdrawal',
        ));

        return response()->json([
            'message' => 'Demande de retrait enregistrée. Traitement automatique en cours.',
            'withdrawal' => $withdrawal,
        ], 201);
    }

    /**
     * Affiche au marchand le devis DexPay avant toute création de payout.
     */
    public function withdrawalQuote(Request $request)
    {
        $this->ensureMerchantWalletAccess($request);
        $validated = $request->validate([
            'amount' => 'required|integer|min:1000',
            'payout_method' => 'required|in:wave,orange_money',
        ]);

        $provider = match ($validated['payout_method']) {
            'wave' => 'wave_sn_payout',
            'orange_money' => 'om_sn_payout',
        };

        try {
            $quote = app(\App\Services\DexpayService::class)->quotePayout(
                $validated['amount'],
                $provider,
            );
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Le devis DexPay est momentanément indisponible. Aucun retrait n’a été créé.',
            ], 503);
        }

        return response()->json(['quote' => $quote]);
    }

    public function withdrawalHistory(Request $request)
    {
        $this->ensureMerchantWalletAccess($request);
        $wallet = $request->user()->tenant->wallet;

        if (!$wallet) {
            return response()->json(['data' => []]);
        }

        $withdrawals = $wallet->withdrawalRequests()
            ->with('processedBy')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($withdrawals);
    }

    private function ensureMerchantWalletAccess(Request $request): void
    {
        abort_unless($request->user()->hasAnyRole([
            'vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin',
        ]), 403, 'Accès au portefeuille réservé aux utilisateurs de la boutique.');
    }
}
