<?php

namespace App\Providers;

use App\Models\Order;
use App\Models\Supplier;
use App\Models\SupplierOrder;
use App\Policies\OrderPolicy;
use App\Policies\SupplierOrderPolicy;
use App\Policies\SupplierPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Supplier::class, SupplierPolicy::class);
        Gate::policy(SupplierOrder::class, SupplierOrderPolicy::class);
    }
}
