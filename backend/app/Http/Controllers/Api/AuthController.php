<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;
    private const DECAY_SECONDS = 60;

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'max:255', 'unique:users'],
            'phone'     => ['required', 'string', 'max:20'],
            'password'  => ['required', 'string', 'min:8', 'max:128', 'confirmed'],
            'account_type' => ['sometimes', 'in:boutique,client'],
            'shop_name' => ['required_unless:account_type,client', 'nullable', 'string', 'max:255'],
            'plan_slug' => ['sometimes', 'string', 'exists:subscription_plans,slug'],
            'wave_number' => ['nullable', 'string', 'max:20'],
            'orange_money_number' => ['nullable', 'string', 'max:20'],
            'device_name' => ['sometimes', 'string', 'max:80'],
        ]);

        return \DB::transaction(function () use ($request) {
            $accountType = $request->input('account_type', 'boutique');

            // Un client final possède son propre accès, mais il doit déjà être
            // connu de la boutique (même email et téléphone) afin d'éviter
            // qu'un tiers accède à un dossier de paiement qui ne lui appartient pas.
            if ($accountType === 'client') {
                $client = Client::withoutGlobalScopes()
                    ->where('email', $request->email)
                    ->where('phone', $request->phone)
                    ->first();

                if (! $client) {
                    throw ValidationException::withMessages([
                        'email' => ['Votre fiche client est introuvable. Demandez à votre boutique d’enregistrer le même email et le même numéro de téléphone.'],
                    ]);
                }

                if ($client->user_id) {
                    throw ValidationException::withMessages([
                        'email' => ['Un compte Client est déjà associé à cette fiche. Utilisez « Mot de passe oublié ».'],
                    ]);
                }

                $user = User::create([
                    'tenant_id' => $client->tenant_id,
                    'shop_id' => $client->shop_id,
                    'name' => $request->name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'password' => Hash::make($request->password),
                    'is_active' => true,
                ]);
                $user->assignRole('client');
                $client->update(['user_id' => $user->id]);

                AuditLog::create([
                    'tenant_id' => $client->tenant_id,
                    'user_id' => $user->id,
                    'event' => 'auth.client_registered',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                return response()->json([
                    'message' => 'Compte Client créé. Vous pouvez consulter vos dossiers.',
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => 'client',
                    ],
                ], 201);
            }

            // Create tenant
            $tenant = \App\Models\Tenant::create([
                'name' => $request->shop_name,
                'slug' => \Str::slug($request->shop_name) . '-' . \Str::random(4),
                'email' => $request->email,
                'phone' => $request->phone,
                'wave_number' => $request->wave_number,
                'orange_money_number' => $request->orange_money_number,
                'is_active' => true,
            ]);

            // Create default shop
            $shop = \App\Models\Shop::create([
                'tenant_id' => $tenant->id,
                'name' => $request->shop_name,
                'phone' => $request->phone,
                'is_active' => true,
            ]);

            // Create admin user
            $user = User::create([
                'tenant_id' => $tenant->id,
                'shop_id' => $shop->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);
            $user->assignRole('admin_entreprise');

            // Create trial subscription
            $planSlug = $request->plan_slug ?? 'essentiel';
            $plan = SubscriptionPlan::where('slug', $planSlug)->first();
            if ($plan) {
                $subscriptionService = app(SubscriptionService::class);
                $subscriptionService->createTrialSubscription($tenant, $plan);
            }

            // Create wallet
            $tenant->getOrCreateWallet();

            $tokenName = $this->tokenName($request);
            $token = $user->createToken($tokenName, ['*'], now()->addHours(8))->plainTextToken;

            AuditLog::create([
                'tenant_id'  => $tenant->id,
                'user_id'    => $user->id,
                'event'      => 'auth.register',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'token' => $token,
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => 'admin_entreprise',
                    'shop'  => $shop->name,
                ],
                'subscription' => [
                    'status' => 'trial',
                    'plan' => $plan?->name,
                    'trial_ends_at' => now()->addDays(14)->toISOString(),
                ],
            ], 201);
        });
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:128'],
            'device_name' => ['sometimes', 'string', 'max:80'],
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

        // Renouveler uniquement la session du même type d'appareil. Une connexion
        // mobile ne doit pas invalider la session web, et inversement.
        $tokenName = $this->tokenName($request);
        $user->tokens()->where('name', $tokenName)->delete();

        $token = $user->createToken($tokenName, ['*'], now()->addHours(8))->plainTextToken;
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

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);
        $user = $request->user();
        $user->update($validated);

        AuditLog::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'event' => 'auth.profile_updated',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Profil mis à jour.']);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'max:128', 'confirmed'],
        ]);
        $user = $request->user();
        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }
        $user->update(['password' => Hash::make($validated['password'])]);
        // Révoquer les autres sessions après une action de sécurité.
        $user->tokens()->whereKeyNot($user->currentAccessToken()->id)->delete();

        AuditLog::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'event' => 'auth.password_updated',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Mot de passe mis à jour.']);
    }

    private function tokenName(Request $request): string
    {
        $device = \Str::slug($request->string('device_name')->trim()->value() ?: 'appareil');

        return 'api:' . ($device ?: 'appareil');
    }
}
