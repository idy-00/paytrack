<?php

namespace App\Policies;

use App\Models\Shop;
use App\Models\User;

class ShopPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin_entreprise', 'super_admin']);
    }

    public function view(User $user, Shop $shop): bool
    {
        if ($user->hasRole('responsable_boutique')) {
            return $user->shop_id === $shop->id;
        }
        return $this->sameTenant($user, $shop) && $user->hasAnyRole(['admin_entreprise', 'super_admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin_entreprise', 'super_admin']);
    }

    public function update(User $user, Shop $shop): bool
    {
        return $this->sameTenant($user, $shop) && $user->hasAnyRole(['admin_entreprise', 'super_admin']);
    }

    public function delete(User $user, Shop $shop): bool
    {
        return $this->sameTenant($user, $shop) && $user->hasRole('super_admin');
    }

    private function sameTenant(User $user, Shop $shop): bool
    {
        return $user->hasRole('super_admin') || $user->tenant_id === $shop->tenant_id;
    }
}
