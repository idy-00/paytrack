<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;

class SalePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']);
    }

    public function view(User $user, Sale $sale): bool
    {
        // Client can only see their own sales
        if ($user->hasRole('client')) {
            return $sale->client?->user_id === $user->id && $sale->tenant_id === $user->tenant_id;
        }
        return $this->sameTenan($user, $sale) &&
            $user->hasAnyRole(['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']);
    }

    public function update(User $user, Sale $sale): bool
    {
        return $this->sameTenan($user, $sale) &&
            $user->hasAnyRole(['responsable_boutique', 'admin_entreprise', 'super_admin']);
    }

    public function delete(User $user, Sale $sale): bool
    {
        return $user->hasAnyRole(['admin_entreprise', 'super_admin']) && $this->sameTenan($user, $sale);
    }

    public function recordPayment(User $user, Sale $sale): bool
    {
        return $this->sameTenan($user, $sale) &&
            $user->hasAnyRole(['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']);
    }

    private function sameTenan(User $user, Sale $sale): bool
    {
        return $user->hasRole('super_admin') || $user->tenant_id === $sale->tenant_id;
    }
}
