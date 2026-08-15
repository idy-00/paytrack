<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\TenantKycDocument;
use App\Models\Wallet;
use App\Models\WithdrawalRequest;
use App\Services\IntechService;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;

class AtaabaAdminController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService,
        private IntechService $intechService
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

    public function intechBalance()
    {
        $balance = $this->intechService->getBalance();

        if (!$balance) {
            return response()->json([
                'configured' => $this->intechService->isConfigured(),
                'balance' => null,
                'message' => 'Unable to fetch Intech balance',
            ]);
        }

        return response()->json([
            'configured' => true,
            'balance' => $balance,
        ]);
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
}
