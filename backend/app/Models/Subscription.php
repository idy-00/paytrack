<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Subscription extends Model
{
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

    public function getCurrentPrice(): int
    {
        return $this->billing_cycle === 'yearly'
            ? $this->plan->price_yearly
            : $this->plan->price_monthly;
    }

    public function activate(Carbon $start = null): void
    {
        $start = $start ?? now();
        $end = $this->billing_cycle === 'yearly'
            ? $start->copy()->addYear()
            : $start->copy()->addMonth();

        $this->update([
            'status' => 'active',
            'current_period_start' => $start,
            'current_period_end' => $end,
            'suspended_at' => null,
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
