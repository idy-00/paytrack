<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    public function viewAny(User $user): bool { return $user->hasAnyRole(['vendeur', 'responsable_boutique', 'admin_entreprise', 'super_admin']); }
    public function view(User $user, Article $article): bool { return $this->sameTenant($user, $article) && $this->viewAny($user); }
    public function create(User $user): bool { return $user->hasAnyRole(['responsable_boutique', 'admin_entreprise', 'super_admin']); }
    public function update(User $user, Article $article): bool { return $this->sameTenant($user, $article) && $this->create($user); }
    public function delete(User $user, Article $article): bool { return $this->update($user, $article); }
    private function sameTenant(User $user, Article $article): bool { return $user->hasRole('super_admin') || $user->tenant_id === $article->tenant_id; }
}
