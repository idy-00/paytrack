<?php

namespace App\Policies;

use App\Models\SupplierOrder;
use App\Models\User;

class SupplierOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant->canUseSupplierOrders();
    }

    public function view(User $user, SupplierOrder $order): bool
    {
        return $user->tenant_id === $order->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->tenant->canUseSupplierOrders();
    }

    public function update(User $user, SupplierOrder $order): bool
    {
        return $user->tenant_id === $order->tenant_id;
    }

    public function delete(User $user, SupplierOrder $order): bool
    {
        return $user->tenant_id === $order->tenant_id && $user->can('sales.delete');
    }
}
