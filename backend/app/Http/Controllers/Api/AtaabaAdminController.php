<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\TenantKycDocument;
use App\Models\Wallet;
use App\Models\WalletReserve;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use App\Services\DexpayService;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;

class AtaabaAdminController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService,
        private DexpayService $dexpayService
    ) {}

    public function dashboard()
    {
        return response()->json([
            'tenants' => [
                'total' => Tenant::count(),
                'active' => Tenant::whereHas('subscription', fn($q) => $q->whereIn('status', ['trial', 'active']))->count(),
                'trial' => Subscription::where('status', 'trial')->count(),
                'suspended' => Subscription::where('status', 'suspended')->count(),
            ],
            'revenue' => [
                'total' => SubscriptionInvoice::where('status', 'paid')->sum('amount'),
                'this_month' => SubscriptionInvoice::where('status', 'paid')
                    ->whereMonth('paid_at', now()->month)
                    ->whereYear('paid_at', now()->year)
                    ->sum('amount'),
            ],
            'wallets' => [
                'total_balance' => Wallet::sum('balance'),
                'pending_withdrawals' => WithdrawalRequest::where('status', 'pending')->sum('amount'),
            ],
            'assisted_setup_pending' => Subscription::where('assisted_setup_requested', true)
                ->whereHas('tenant')
                ->count(),
        ]);
    }

    public function tenants(Request $request)
    {
        $query = Tenant::with(['subscription.plan', 'wallet'])
            ->withCount(['users', 'articles', 'orders', 'sales']);

        if ($status = $request->get('status')) {
            $query->whereHas('subscription', fn($q) => $q->where('status', $status));
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function tenantDetail(Tenant $tenant)
    {
        $tenant->load(['subscription.plan', 'wallet', 'users', 'shops']);
        $tenant->loadCount(['articles', 'orders', 'sales', 'clients']);

        return response()->json($tenant);
    }

    public function updateTenantLimits(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'max_products' => 'nullable|integer|min:1',
            'max_users' => 'nullable|integer|min:1',
        ]);

        $settings = $tenant->settings ?? [];
        $settings['custom_limits'] = $validated;
        $tenant->update(['settings' => $settings]);

        return response()->json(['message' => 'Limites mises à jour', 'tenant' => $tenant]);
    }

    public function subscriptions(Request $request)
    {
        $query = Subscription::with(['tenant', 'plan']);

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function invoices(Request $request)
    {
        $query = SubscriptionInvoice::with(['tenant', 'subscription.plan']);

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function assistedSetupRequests()
    {
        $requests = Subscription::with('tenant')
            ->where('assisted_setup_requested', true)
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($requests);
    }

    public function markAssistedSetupDone(Subscription $subscription)
    {
        $subscription->update(['assisted_setup_requested' => false]);
        return response()->json(['message' => 'Configuration assistée marquée comme terminée']);
    }

    public function withdrawalRequests(Request $request)
    {
        $query = WithdrawalRequest::with(['tenant', 'requestedBy', 'processedBy']);

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function processWithdrawal(Request $request, WithdrawalRequest $withdrawal)
    {
        $validated = $request->validate([
            'action' => 'required|in:approve,reject,auto_cashout',
            'payout_reference' => 'required_if:action,approve|string|nullable',
            'reason' => 'required_if:action,reject|string|nullable',
        ]);

        if ($validated['action'] === 'auto_cashout') {
            $result = $withdrawal->initiateCashOut();

            if ($result['success']) {
                return response()->json([
                    'message' => 'CashOut automatique initié',
                    'transactionId' => $result['transactionId'] ?? null,
                    'status' => 'processing',
                ]);
            }

            return response()->json([
                'message' => 'CashOut échoué: ' . ($result['error'] ?? 'Unknown error'),
                'withdrawal' => $withdrawal->fresh(),
            ], 400);
        }

        if ($validated['action'] === 'approve') {
            $withdrawal->approve($request->user(), $validated['payout_reference'] ?? null);
            return response()->json(['message' => 'Retrait approuvé (manuel)']);
        }

        $withdrawal->reject($request->user(), $validated['reason']);
        return response()->json(['message' => 'Retrait rejeté']);
    }

    /**
     * Afficher le statut DexPay et les providers disponibles
     * Note: DexPay n'a pas d'endpoint /balance public, le solde est visible dans le dashboard
     */
    public function dexpayStatus()
    {
        $providers = $this->dexpayService->getPayoutProviders('SN');

        return response()->json([
            'configured' => $this->dexpayService->isConfigured(),
            'providers' => $providers,
            'dashboard_url' => 'https://app.dexpay.africa',
            'note' => 'Le solde ATAABA est visible dans le dashboard DexPay',
        ]);
    }

    /**
     * Legacy endpoint - redirige vers dexpayStatus
     * @deprecated Utiliser dexpayStatus
     */
    public function intechBalance()
    {
        return $this->dexpayStatus();
    }

    public function kycDocuments(Request $request)
    {
        $query = TenantKycDocument::with(['tenant', 'reviewer']);

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function reviewKycDocument(Request $request, TenantKycDocument $document)
    {
        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'reason' => 'required_if:action,reject|string|nullable',
        ]);

        if ($validated['action'] === 'approve') {
            $document->approve($request->user());
            return response()->json(['message' => 'Document KYC approuvé']);
        }

        $document->reject($request->user(), $validated['reason']);
        return response()->json(['message' => 'Document KYC rejeté']);
    }

    public function expiringSubscriptions()
    {
        return response()->json($this->subscriptionService->checkExpiringSoon());
    }

    public function plans()
    {
        return response()->json(SubscriptionPlan::orderBy('price_monthly')->get());
    }

    public function updatePlan(Request $request, SubscriptionPlan $plan)
    {
        $validated = $request->validate([
            'price_monthly' => 'sometimes|integer|min:0',
            'price_yearly' => 'sometimes|integer|min:0',
            'max_products' => 'sometimes|nullable|integer|min:1',
            'max_users' => 'sometimes|integer|min:1',
            'is_active' => 'sometimes|boolean',
        ]);

        $plan->update($validated);
        return response()->json(['message' => 'Plan mis à jour', 'plan' => $plan]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GESTION FONDS CARTE (retenus, réserves, chargebacks)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Dashboard des fonds carte : retenus, réserves, chargebacks
     */
    public function cardFundsDashboard()
    {
        return response()->json([
            'held_funds' => [
                'total' => Wallet::sum('held_balance'),
                'transactions_count' => WalletTransaction::whereIn('release_status', ['held', 'partial'])->count(),
            ],
            'reserves' => [
                'total' => Wallet::sum('reserved_balance'),
                'active_count' => WalletReserve::where('status', 'active')->count(),
            ],
            'chargebacks' => [
                'pending' => WalletReserve::where('reason', 'chargeback_pending')->where('status', 'active')->count(),
                'total_lost' => WalletTransaction::where('special_type', 'chargeback')->sum('amount'),
            ],
        ]);
    }

    /**
     * Liste des transactions carte avec fonds retenus
     */
    public function heldTransactions(Request $request)
    {
        $query = WalletTransaction::with(['wallet.tenant', 'transactionable'])
            ->where('payment_method', 'card')
            ->whereIn('release_status', ['held', 'partial']);

        if ($tenantId = $request->get('tenant_id')) {
            $query->where('tenant_id', $tenantId);
        }

        return response()->json($query->orderBy('available_at')->paginate(20));
    }

    /**
     * Libérer manuellement les fonds d'une transaction carte
     */
    public function releaseHeldFunds(Request $request, WalletTransaction $transaction)
    {
        if ($transaction->release_status === 'released') {
            return response()->json(['message' => 'Fonds déjà libérés'], 400);
        }

        $validated = $request->validate([
            'amount' => 'nullable|integer|min:1',
            'full' => 'nullable|boolean',
        ]);

        $wallet = $transaction->wallet;
        if (!$wallet) {
            return response()->json(['message' => 'Wallet non trouvé'], 404);
        }

        $amount = $validated['amount'] ?? null;
        $isFull = $validated['full'] ?? ($amount === null);

        $wallet->releaseFunds($transaction, $amount, $isFull);

        return response()->json([
            'message' => 'Fonds libérés',
            'transaction' => $transaction->fresh(),
        ]);
    }

    /**
     * Liste des réserves de garantie
     */
    public function reserves(Request $request)
    {
        $query = WalletReserve::with(['wallet.tenant', 'createdBy', 'releasedBy']);

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($tenantId = $request->get('tenant_id')) {
            $query->where('tenant_id', $tenantId);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    /**
     * Créer une réserve de garantie (retenue DexPay)
     */
    public function createReserve(Request $request)
    {
        $validated = $request->validate([
            'wallet_id' => 'required|exists:wallets,id',
            'amount' => 'required|integer|min:1',
            'reason' => 'required|string|max:100',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $wallet = Wallet::findOrFail($validated['wallet_id']);

        $reserve = $wallet->applyReserve(
            $validated['amount'],
            $validated['reason'],
            $request->user(),
            $validated['reference'] ?? null,
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Réserve créée',
            'reserve' => $reserve->load('wallet.tenant'),
        ], 201);
    }

    /**
     * Libérer une réserve de garantie
     */
    public function releaseReserve(Request $request, WalletReserve $reserve)
    {
        if ($reserve->status !== 'active') {
            return response()->json(['message' => 'Réserve déjà traitée'], 400);
        }

        $reserve->wallet->releaseReserve($reserve, $request->user());

        return response()->json([
            'message' => 'Réserve libérée',
            'reserve' => $reserve->fresh(),
        ]);
    }

    /**
     * Convertir une réserve en chargeback (débiter définitivement)
     */
    public function convertToChargeback(Request $request, WalletReserve $reserve)
    {
        if ($reserve->status !== 'active') {
            return response()->json(['message' => 'Réserve déjà traitée'], 400);
        }

        $transaction = $reserve->wallet->convertReserveToChargeback($reserve, $request->user());

        return response()->json([
            'message' => 'Chargeback appliqué',
            'reserve' => $reserve->fresh(),
            'transaction' => $transaction,
        ]);
    }

    /**
     * Appliquer un chargeback direct (sans réserve préalable)
     */
    public function applyChargeback(Request $request)
    {
        $validated = $request->validate([
            'wallet_id' => 'required|exists:wallets,id',
            'amount' => 'required|integer|min:1',
            'reason' => 'required|string|max:255',
            'reference' => 'nullable|string|max:100',
        ]);

        $wallet = Wallet::findOrFail($validated['wallet_id']);

        $transaction = $wallet->forceDebit(
            $validated['amount'],
            "Chargeback: {$validated['reason']}",
            'chargeback'
        );

        return response()->json([
            'message' => 'Chargeback appliqué',
            'transaction' => $transaction,
            'new_balance' => $wallet->fresh()->balance,
        ]);
    }
}
