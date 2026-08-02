<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['responsable_boutique', 'admin_entreprise', 'super_admin']);
    }

    public function view(User $authUser, User $targetUser): bool
    {
        if ($authUser->id === $targetUser->id) return true;
        if ($authUser->hasRole('responsable_boutique')) {
            return $authUser->shop_id === $targetUser->shop_id && $authUser->tenant_id === $targetUser->tenant_id;
        }
        return $this->sameTenant($authUser, $targetUser) && $authUser->hasAnyRole(['admin_entreprise', 'super_admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin_entreprise', 'super_admin']);
    }

    public function update(User $authUser, User $targetUser): bool
    {
        if ($authUser->id === $targetUser->id) return true;
        if ($targetUser->hasRole('super_admin') && !$authUser->hasRole('super_admin')) return false;
        return $this->sameTenant($authUser, $targetUser) && $authUser->hasAnyRole(['admin_entreprise', 'super_admin']);
    }

    public function delete(User $authUser, User $targetUser): bool
    {
        if ($authUser->id === $targetUser->id) return false;
        if ($targetUser->hasRole('super_admin')) return false;
        return $this->sameTenant($authUser, $targetUser) && $authUser->hasAnyRole(['admin_entreprise', 'super_admin']);
    }

    public function activate(User $authUser, User $targetUser): bool
    {
        return $this->update($authUser, $targetUser);
    }

    public function assignRole(User $authUser, User $targetUser): bool
    {
        if ($targetUser->hasRole('super_admin') && !$authUser->hasRole('super_admin')) return false;
        return $this->sameTenant($authUser, $targetUser) && $authUser->hasAnyRole(['admin_entreprise', 'super_admin']);
    }

    private function sameTenant(User $authUser, User $targetUser): bool
    {
        return $authUser->hasRole('super_admin') || $authUser->tenant_id === $targetUser->tenant_id;
    }
}
