<?php

namespace App\Policies;

use App\Models\Supplier;
use App\Models\User;

class SupplierPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant->canUseSupplierOrders();
    }

    public function view(User $user, Supplier $supplier): bool
    {
        return $user->tenant_id === $supplier->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->tenant->canUseSupplierOrders();
    }

    public function update(User $user, Supplier $supplier): bool
    {
        return $user->tenant_id === $supplier->tenant_id;
    }

    public function delete(User $user, Supplier $supplier): bool
    {
        return $user->tenant_id === $supplier->tenant_id && $user->can('sales.delete');
    }
}
