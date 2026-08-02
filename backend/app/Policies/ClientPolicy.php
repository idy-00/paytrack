<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool { return $user->hasAnyRole(['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']); }
    public function view(User $user, Client $client): bool { return $this->sameTenant($user, $client) && $this->viewAny($user); }
    public function create(User $user): bool { return $this->viewAny($user); }
    public function update(User $user, Client $client): bool { return $this->sameTenant($user, $client) && $user->hasAnyRole(['responsable_boutique', 'admin_entreprise', 'super_admin']); }
    public function delete(User $user, Client $client): bool { return $this->sameTenant($user, $client) && $user->hasAnyRole(['admin_entreprise', 'super_admin']); }
    private function sameTenant(User $user, Client $client): bool { return $user->hasRole('super_admin') || $user->tenant_id === $client->tenant_id; }
}
