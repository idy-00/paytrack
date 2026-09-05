<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use Carbon\Carbon;

class SubscriptionService
{
    public function createTrialSubscription(Tenant $tenant, SubscriptionPlan $plan): Subscription
    {
        return Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
            'status' => 'trial',
            'trial_ends_at' => now()->addDays(14),
        ]);
    }

    public function createInvoice(Subscription $subscription): SubscriptionInvoice
    {
        $amount = $subscription->getCurrentPrice();
        $dueDate = $subscription->isTrial()
            ? $subscription->trial_ends_at
            : $subscription->current_period_end;

        return SubscriptionInvoice::create([
            'tenant_id' => $subscription->tenant_id,
            'subscription_id' => $subscription->id,
            'invoice_number' => SubscriptionInvoice::generateNumber(),
            'amount' => $amount,
            'status' => 'pending',
            'due_date' => $dueDate,
        ]);
    }

    public function activateFromPayment(SubscriptionInvoice $invoice, ?string $paymentReference = null): void
    {
        $invoice->markPaid($paymentReference);
        $invoice->subscription->activate();
    }

    public function changePlan(Subscription $subscription, SubscriptionPlan $newPlan, string $billingCycle = null): void
    {
        $subscription->update([
            'plan_id' => $newPlan->id,
            'billing_cycle' => $billingCycle ?? $subscription->billing_cycle,
        ]);
    }

    public function checkExpiringSoon(): array
    {
        $alerts = [];
        $thresholds = [7, 3, 1]; // days

        foreach ($thresholds as $days) {
            $date = now()->addDays($days)->toDateString();

            $expiring = Subscription::with('tenant')
                ->where('status', 'active')
                ->whereDate('current_period_end', $date)
                ->get();

            foreach ($expiring as $sub) {
                $alerts[] = [
                    'tenant_id' => $sub->tenant_id,
                    'tenant_name' => $sub->tenant->name,
                    'days_left' => $days,
                    'expires_at' => $sub->current_period_end,
                ];
            }

            // Also check trials
            $expiringTrials = Subscription::with('tenant')
                ->where('status', 'trial')
                ->whereDate('trial_ends_at', $date)
                ->get();

            foreach ($expiringTrials as $sub) {
                $alerts[] = [
                    'tenant_id' => $sub->tenant_id,
                    'tenant_name' => $sub->tenant->name,
                    'days_left' => $days,
                    'expires_at' => $sub->trial_ends_at,
                    'is_trial' => true,
                ];
            }
        }

        return $alerts;
    }

    public function suspendExpired(): int
    {
        $count = 0;

        // Expired trials
        $expiredTrials = Subscription::where('status', 'trial')
            ->where('trial_ends_at', '<', now())
            ->get();

        foreach ($expiredTrials as $sub) {
            $sub->suspend();
            $count++;
        }

        // Expired active subscriptions
        $expired = Subscription::where('status', 'active')
            ->where('current_period_end', '<', now())
            ->get();

        foreach ($expired as $sub) {
            $sub->suspend();
            $count++;
        }

        return $count;
    }
}
