<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Subscription extends Model
{
    /**
     * Cycles de facturation supportés
     */
    public const BILLING_CYCLES = [
        'daily',       // Journalier (tests)
        'weekly',      // Hebdomadaire
        'monthly',     // Mensuel
        'quarterly',   // Trimestriel (3 mois)
        'semiannual',  // Semestriel (6 mois)
        'yearly',      // Annuel
    ];

    protected $fillable = [
        'tenant_id', 'plan_id', 'billing_cycle', 'status',
        'trial_ends_at', 'current_period_start', 'current_period_end',
        'cancelled_at', 'suspended_at', 'assisted_setup_requested',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'cancelled_at' => 'datetime',
        'suspended_at' => 'datetime',
        'assisted_setup_requested' => 'boolean',
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function plan() { return $this->belongsTo(SubscriptionPlan::class, 'plan_id'); }
    public function invoices() { return $this->hasMany(SubscriptionInvoice::class); }
    public function payments() { return $this->hasMany(SubscriptionPayment::class); }

    public function isActive(): bool { return $this->status === 'active'; }
    public function isTrial(): bool { return $this->status === 'trial'; }
    public function isExpired(): bool { return $this->status === 'expired'; }
    public function isSuspended(): bool { return $this->status === 'suspended'; }

    public function canAccess(): bool
    {
        return in_array($this->status, ['trial', 'active']);
    }

    public function daysUntilExpiry(): ?int
    {
        if ($this->isTrial() && $this->trial_ends_at) {
            return max(0, now()->diffInDays($this->trial_ends_at, false));
        }
        if ($this->current_period_end) {
            return max(0, now()->diffInDays($this->current_period_end, false));
        }
        return null;
    }

    /**
     * Prix selon le cycle de facturation
     */
    public function getCurrentPrice(): int
    {
        $plan = $this->plan;

        return match($this->billing_cycle) {
            'daily' => $plan->price_daily ?? 0,
            'weekly' => $plan->price_weekly ?? 0,
            'monthly' => $plan->price_monthly,
            'quarterly' => $plan->price_quarterly ?? ($plan->price_monthly * 3),
            'semiannual' => $plan->price_semiannual ?? ($plan->price_monthly * 6),
            'yearly' => $plan->price_yearly,
            default => $plan->price_monthly,
        };
    }

    /**
     * Calculer la date de fin de période selon le cycle
     */
    public function calculatePeriodEnd(Carbon $start): Carbon
    {
        return match($this->billing_cycle) {
            'daily' => $start->copy()->addDay(),
            'weekly' => $start->copy()->addWeek(),
            'monthly' => $start->copy()->addMonth(),
            'quarterly' => $start->copy()->addMonths(3),
            'semiannual' => $start->copy()->addMonths(6),
            'yearly' => $start->copy()->addYear(),
            default => $start->copy()->addMonth(),
        };
    }

    /**
     * Libellé du cycle de facturation
     */
    public function getBillingCycleLabelAttribute(): string
    {
        return match($this->billing_cycle) {
            'daily' => 'Journalier',
            'weekly' => 'Hebdomadaire',
            'monthly' => 'Mensuel',
            'quarterly' => 'Trimestriel',
            'semiannual' => 'Semestriel',
            'yearly' => 'Annuel',
            default => $this->billing_cycle,
        };
    }

    public function activate(Carbon $start = null): void
    {
        $start = $start ?? now();
        $end = $this->calculatePeriodEnd($start);

        $this->update([
            'status' => 'active',
            'current_period_start' => $start,
            'current_period_end' => $end,
            'suspended_at' => null,
        ]);
    }

    /**
     * Renouveler l'abonnement pour une nouvelle période
     */
    public function renew(): void
    {
        $start = $this->current_period_end && $this->current_period_end->isFuture()
            ? $this->current_period_end
            : now();
        $end = $this->calculatePeriodEnd($start);

        $this->update([
            'status' => 'active',
            'current_period_start' => $start,
            'current_period_end' => $end,
        ]);
    }

    public function suspend(): void
    {
        $this->update([
            'status' => 'suspended',
            'suspended_at' => now(),
        ]);
    }

    public function expire(): void
    {
        $this->update(['status' => 'expired']);
    }
}
