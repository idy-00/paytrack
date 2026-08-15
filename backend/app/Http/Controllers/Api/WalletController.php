<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $tenant = $request->user()->tenant;
        $wallet = $tenant->getOrCreateWallet();

        return response()->json([
            'wallet' => $wallet,
            'pending_withdrawals' => $wallet->withdrawalRequests()
                ->where('status', 'pending')
                ->sum('amount'),
        ]);
    }

    public function transactions(Request $request)
    {
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
        $validated = $request->validate([
            'amount' => 'required|integer|min:1000',
            'payout_method' => 'required|in:wave,orange_money,free_money,bank_transfer',
            'payout_account' => 'required|string|max:100',
        ]);

        $tenant = $request->user()->tenant;

        if (!$tenant->canRequestWithdrawal()) {
            return response()->json([
                'message' => 'KYC non validé. Veuillez soumettre vos documents d\'identité.',
                'kyc_status' => $tenant->kyc_status,
            ], 403);
        }

        $wallet = $tenant->getOrCreateWallet();

        if (!$wallet->canWithdraw($validated['amount'])) {
            return response()->json([
                'message' => 'Solde insuffisant',
                'balance' => $wallet->balance,
            ], 400);
        }

        $pendingTotal = $wallet->withdrawalRequests()
            ->whereIn('status', ['pending', 'processing'])
            ->sum('amount');

        $available = $wallet->balance - $pendingTotal;
        if ($available < $validated['amount']) {
            return response()->json([
                'message' => 'Solde disponible insuffisant (retraits en attente)',
                'available' => $available,
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

        return response()->json([
            'message' => 'Demande de retrait enregistrée. Traitement automatique en cours.',
            'withdrawal' => $withdrawal,
        ], 201);
    }

    public function withdrawalHistory(Request $request)
    {
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
}
