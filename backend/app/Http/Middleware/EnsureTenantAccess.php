<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures every authenticated request operates within the user's tenant.
 * Super admins bypass this check.
 */
class EnsureTenantAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Super admins can access any tenant
        if ($user->hasRole('super_admin')) {
            return $next($request);
        }

        // Fix #4: re-check is_active on every request, not just at login
        if (! $user->is_active) {
            $user->tokens()->delete(); // Revoke all tokens immediately
            return response()->json(['message' => 'Compte désactivé. Contactez votre administrateur.'], 403);
        }

        if (! $user->tenant_id) {
            return response()->json(['message' => 'No tenant associated with this account.'], 403);
        }

        // Bind tenant context for the rest of the request
        app()->instance('current_tenant_id', $user->tenant_id);

        return $next($request);
    }
}
