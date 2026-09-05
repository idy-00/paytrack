<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('sanctum');

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Les rôles sont gérés par Spatie, pas par une colonne users.role.
        if (!$user->getRoleNames()->contains('super_admin')) {
            return response()->json([
                'message' => 'Accès refusé. Réservé aux administrateurs ATAABA.',
            ], 403);
        }

        return $next($request);
    }
}
