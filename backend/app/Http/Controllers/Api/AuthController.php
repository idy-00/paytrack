<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;
    private const DECAY_SECONDS = 60;

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:128'],
        ]);

        // Rate limiting: 5 attempts per minute per IP+email
        $key = 'login:' . $request->ip() . ':' . strtolower($request->email);
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'message' => "Trop de tentatives. Réessayez dans {$seconds} secondes.",
            ], 429);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, self::DECAY_SECONDS);
            // Log failed attempt (no tenant context needed)
            AuditLog::create([
                'tenant_id' => null,
                'user_id'   => $user?->id,
                'event'     => 'auth.login.failed',
                'new_values'=> ['email' => $request->email],
                'ip_address'=> $request->ip(),
                'user_agent'=> $request->userAgent(),
            ]);
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Compte désactivé. Contactez votre administrateur.'], 403);
        }

        RateLimiter::clear($key);

        // Revoke old tokens for same device (optional: keep multi-device by removing this)
        $user->tokens()->where('name', 'api')->delete();

        $token = $user->createToken('api', ['*'], now()->addHours(8))->plainTextToken;
        $user->update(['last_active_at' => now()]);

        AuditLog::create([
            'tenant_id'  => $user->tenant_id,
            'user_id'    => $user->id,
            'event'      => 'auth.login.success',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->getRoleNames()->first(),
                'shop'  => $user->shop?->name,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->user()->currentAccessToken()->delete();

        AuditLog::create([
            'tenant_id'  => $user->tenant_id,
            'user_id'    => $user->id,
            'event'      => 'auth.logout',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');
        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->getRoleNames()->first(),
        ]);
    }
}
