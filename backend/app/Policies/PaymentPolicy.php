<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']);
    }

    public function view(User $user, Payment $payment): bool
    {
        if ($user->hasRole('client')) {
            return $payment->sale?->client?->user_id === $user->id && $payment->tenant_id === $user->tenant_id;
        }
        return $this->sameTenant($user, $payment) && $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']);
    }

    public function delete(User $user, Payment $payment): bool
    {
        return false;
    }

    private function sameTenant(User $user, Payment $payment): bool
    {
        return $user->hasRole('super_admin') || $user->tenant_id === $payment->tenant_id;
    }
}
