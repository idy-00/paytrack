<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Order $order): bool
    {
        return $user->tenant_id === $order->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->can('sales.create');
    }

    public function update(User $user, Order $order): bool
    {
        return $user->tenant_id === $order->tenant_id && $user->can('sales.update');
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->tenant_id === $order->tenant_id && $user->can('sales.delete');
    }

    public function recordPayment(User $user, Order $order): bool
    {
        return $user->tenant_id === $order->tenant_id && $user->can('payments.record');
    }
}
