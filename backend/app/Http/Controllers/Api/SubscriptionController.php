<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Services\PaytechService;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function plans()
    {
        return response()->json(SubscriptionPlan::active()->orderBy('price_monthly')->get());
    }

    private function getSubscriptionService(): SubscriptionService
    {
        return app(SubscriptionService::class);
    }

    private function getPaytechService(): PaytechService
    {
        return app(PaytechService::class);
    }

    public function current(Request $request)
    {
        $tenant = $request->user()->tenant;
        $subscription = $tenant->subscription;

        if (!$subscription) {
            return response()->json(['subscription' => null]);
        }

        $subscription->load('plan');

        return response()->json([
            'subscription' => $subscription,
            'days_until_expiry' => $subscription->daysUntilExpiry(),
            'can_access' => $subscription->canAccess(),
            'limits' => [
                'products' => [
                    'used' => $tenant->articles()->count(),
                    'max' => $subscription->plan->max_products,
                ],
                'users' => [
                    'used' => $tenant->users()->count(),
                    'max' => $subscription->plan->max_users,
                ],
            ],
        ]);
    }

    public function changePlan(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'billing_cycle' => 'sometimes|in:monthly,yearly',
        ]);

        $tenant = $request->user()->tenant;
        $subscription = $tenant->subscription;
        $newPlan = SubscriptionPlan::findOrFail($validated['plan_id']);

        if (!$subscription) {
            $subscription = $this->getSubscriptionService()->createTrialSubscription($tenant, $newPlan);
            if (isset($validated['billing_cycle'])) {
                $subscription->update(['billing_cycle' => $validated['billing_cycle']]);
            }
        } else {
            $this->getSubscriptionService()->changePlan(
                $subscription,
                $newPlan,
                $validated['billing_cycle'] ?? null
            );
        }

        return response()->json([
            'message' => 'Plan modifié',
            'subscription' => $subscription->fresh('plan'),
        ]);
    }

    public function requestAssistedSetup(Request $request)
    {
        $subscription = $request->user()->tenant->subscription;

        if (!$subscription) {
            return response()->json(['message' => 'Aucun abonnement'], 404);
        }

        $subscription->update(['assisted_setup_requested' => true]);

        return response()->json([
            'message' => 'Demande de configuration assistée enregistrée. ATAABA vous contactera sous 24h.',
            'cost' => 10000,
        ]);
    }

    public function invoices(Request $request)
    {
        $invoices = SubscriptionInvoice::where('tenant_id', $request->user()->tenant_id)
            ->with('subscription.plan')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($invoices);
    }

    public function payInvoice(Request $request, SubscriptionInvoice $invoice)
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($invoice->isPaid()) {
            return response()->json(['message' => 'Facture déjà payée'], 400);
        }

        if (!$this->getPaytechService()->isConfigured()) {
            return response()->json([
                'message' => 'Paiement en ligne non disponible. Contactez ATAABA.',
                'code' => 'paytech_not_configured',
            ], 503);
        }

        $payment = $this->getPaytechService()->initiatePayment([
            'item_name' => "Abonnement PayTrack - {$invoice->invoice_number}",
            'amount' => $invoice->amount,
            'reference' => $invoice->invoice_number,
            'description' => "Paiement abonnement PayTrack",
            'metadata' => [
                'type' => 'subscription_invoice',
                'invoice_id' => $invoice->id,
                'tenant_id' => $invoice->tenant_id,
            ],
        ]);

        return response()->json([
            'payment_url' => $payment['redirect_url'] ?? $payment['payment_url'],
            'token' => $payment['token'] ?? null,
        ]);
    }

    public function createRenewalInvoice(Request $request)
    {
        $subscription = $request->user()->tenant->subscription;

        if (!$subscription) {
            return response()->json(['message' => 'Aucun abonnement'], 404);
        }

        // Check if pending invoice exists
        $pending = SubscriptionInvoice::where('subscription_id', $subscription->id)
            ->where('status', 'pending')
            ->first();

        if ($pending) {
            return response()->json([
                'message' => 'Une facture en attente existe déjà',
                'invoice' => $pending,
            ]);
        }

        $invoice = $this->getSubscriptionService()->createInvoice($subscription);

        return response()->json([
            'message' => 'Facture créée',
            'invoice' => $invoice,
        ]);
    }
}
