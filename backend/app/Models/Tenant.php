<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'email', 'phone', 'logo_path',
        'wave_number', 'orange_money_number',
        'address', 'city', 'country', 'currency', 'settings', 'is_active',
        'kyc_status', 'kyc_approved_at',
    ];

    protected $casts = [
        'is_active'       => 'boolean',
        'trial_ends_at'   => 'datetime',
        'kyc_approved_at' => 'datetime',
        'settings'        => 'array',
    ];

    public function users()   { return $this->hasMany(User::class); }
    public function sales()   { return $this->hasMany(Sale::class); }
    public function clients() { return $this->hasMany(Client::class); }
    public function shops()   { return $this->hasMany(Shop::class); }
    public function articles() { return $this->hasMany(Article::class); }
    public function orders()  { return $this->hasMany(Order::class); }
    public function suppliers() { return $this->hasMany(Supplier::class); }
    public function subscription() { return $this->hasOne(Subscription::class)->latest(); }
    public function wallet() { return $this->hasOne(Wallet::class); }
    public function kycDocuments() { return $this->hasMany(TenantKycDocument::class); }

    public function scopeActive($query) { return $query->where('is_active', true); }

    public function getOrCreateWallet(): Wallet
    {
        return $this->wallet ?? $this->wallet()->create(['balance' => 0]);
    }

    public function currentPlan(): ?SubscriptionPlan
    {
        return $this->subscription?->plan;
    }

    public function canAccess(): bool
    {
        return $this->is_active && ($this->subscription?->canAccess() ?? false);
    }

    public function canAddProduct(): bool
    {
        $plan = $this->currentPlan();
        if (!$plan) return false;
        if ($plan->hasUnlimitedProducts()) return true;
        return $this->articles()->count() < $plan->max_products;
    }

    public function canAddUser(): bool
    {
        $plan = $this->currentPlan();
        if (!$plan) return false;
        return $this->users()->count() < $plan->max_users;
    }

    public function canUseSupplierOrders(): bool
    {
        return $this->currentPlan()?->supplier_orders ?? false;
    }

    public function canUseAdvancedStock(): bool
    {
        return $this->currentPlan()?->advanced_stock ?? false;
    }

    public function canUseMultiShop(): bool
    {
        return $this->currentPlan()?->multi_shop ?? false;
    }

    public function isKycApproved(): bool
    {
        return $this->kyc_status === 'approved';
    }

    public function hasAllKycDocuments(): bool
    {
        $required = ['identity', 'address_proof'];
        $uploaded = $this->kycDocuments()->pluck('document_type')->toArray();
        return empty(array_diff($required, $uploaded));
    }

    public function checkKycStatus(): void
    {
        $docs = $this->kycDocuments()->get();

        if ($docs->count() < 2) {
            $this->update(['kyc_status' => 'pending']);
            return;
        }

        $allApproved = $docs->every(fn($d) => $d->status === 'approved');
        $anyRejected = $docs->contains(fn($d) => $d->status === 'rejected');

        if ($allApproved) {
            $this->update([
                'kyc_status' => 'approved',
                'kyc_approved_at' => now(),
            ]);
        } elseif ($anyRejected) {
            $this->update(['kyc_status' => 'rejected']);
        } else {
            $this->update(['kyc_status' => 'pending']);
        }
    }

    public function canRequestWithdrawal(): bool
    {
        return $this->isKycApproved();
    }
}
