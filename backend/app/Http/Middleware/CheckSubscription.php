<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || !$user->tenant) {
            return $next($request);
        }

        $tenant = $user->tenant;
        $subscription = $tenant->subscription;

        if (!$subscription) {
            return response()->json([
                'message' => 'Aucun abonnement actif. Veuillez souscrire à un plan.',
                'code' => 'no_subscription',
            ], 403);
        }

        if (!$subscription->canAccess()) {
            $status = $subscription->status;
            $message = match($status) {
                'suspended' => 'Votre abonnement est suspendu. Renouvelez pour continuer.',
                'expired' => 'Votre abonnement a expiré. Renouvelez pour continuer.',
                'cancelled' => 'Votre abonnement a été annulé.',
                default => 'Accès refusé.',
            };

            return response()->json([
                'message' => $message,
                'code' => 'subscription_' . $status,
                'status' => $status,
            ], 403);
        }

        return $next($request);
    }
}
