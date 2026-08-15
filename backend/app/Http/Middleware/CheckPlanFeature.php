<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPlanFeature
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = $request->user();
        if (!$user || !$user->tenant) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $tenant = $user->tenant;
        $allowed = match($feature) {
            'supplier_orders' => $tenant->canUseSupplierOrders(),
            'advanced_stock' => $tenant->canUseAdvancedStock(),
            'multi_shop' => $tenant->canUseMultiShop(),
            default => false,
        };

        if (!$allowed) {
            $planName = $tenant->currentPlan()?->name ?? 'aucun';
            return response()->json([
                'message' => "Cette fonctionnalité n'est pas disponible avec votre plan ($planName). Passez à un plan supérieur.",
                'code' => 'feature_not_available',
                'feature' => $feature,
                'current_plan' => $planName,
            ], 403);
        }

        return $next($request);
    }
}
