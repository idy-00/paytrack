<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::with(['shop', 'roles'])
            ->where('tenant_id', $request->user()->tenant_id);

        if ($request->user()->hasRole('responsable_boutique')) {
            $query->where('shop_id', $request->user()->shop_id);
        }

        $users = $query->orderBy('name')->get()->map(fn($u) => [
            'id'         => $u->id,
            'name'       => $u->name,
            'email'      => $u->email,
            'phone'      => $u->phone,
            'shop'       => $u->shop?->name,
            'shop_id'    => $u->shop_id,
            'role'       => $u->roles->first()?->name,
            'is_active'  => $u->is_active,
            'last_active_at' => $u->last_active_at,
            'created_at' => $u->created_at,
        ]);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'phone'    => ['nullable', 'string', 'max:20'],
            'password' => ['required', Password::min(8)],
            'shop_id'  => ['nullable', Rule::exists('shops', 'id')->where('tenant_id', $tenantId)],
            'role'     => ['required', 'in:vendeur,responsable_boutique,admin_entreprise'],
        ]);

        $user = User::create([
            'tenant_id' => $tenantId,
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'phone'     => $validated['phone'] ?? null,
            'password'  => Hash::make($validated['password']),
            'shop_id'   => $validated['shop_id'] ?? null,
            'is_active' => true,
        ]);

        $user->assignRole($validated['role']);

        AuditLog::create([
            'tenant_id'      => $tenantId,
            'user_id'        => $request->user()->id,
            'event'          => 'user.created',
            'auditable_type' => User::class,
            'auditable_id'   => $user->id,
            'new_values'     => ['name' => $user->name, 'email' => $user->email, 'role' => $validated['role']],
            'ip_address'     => $request->ip(),
        ]);

        return response()->json([
            'id'      => $user->id,
            'name'    => $user->name,
            'email'   => $user->email,
            'role'    => $validated['role'],
            'shop_id' => $user->shop_id,
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json([
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'phone'      => $user->phone,
            'shop'       => $user->shop?->name,
            'shop_id'    => $user->shop_id,
            'role'       => $user->roles->first()?->name,
            'is_active'  => $user->is_active,
            'last_active_at' => $user->last_active_at,
            'created_at' => $user->created_at,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name'     => ['sometimes', 'required', 'string', 'max:255'],
            'email'    => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone'    => ['nullable', 'string', 'max:20'],
            'shop_id'  => ['nullable', Rule::exists('shops', 'id')->where('tenant_id', $tenantId)],
        ]);

        $oldValues = $user->only(array_keys($validated));
        $user->update($validated);

        AuditLog::create([
            'tenant_id'      => $user->tenant_id,
            'user_id'        => $request->user()->id,
            'event'          => 'user.updated',
            'auditable_type' => User::class,
            'auditable_id'   => $user->id,
            'old_values'     => $oldValues,
            'new_values'     => $validated,
            'ip_address'     => $request->ip(),
        ]);

        return response()->json($user);
    }

    public function toggleActive(Request $request, User $user): JsonResponse
    {
        $this->authorize('activate', $user);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas vous désactiver vous-même.'], 422);
        }

        $user->update(['is_active' => !$user->is_active]);

        if (!$user->is_active) {
            $user->tokens()->delete();
        }

        AuditLog::create([
            'tenant_id'      => $user->tenant_id,
            'user_id'        => $request->user()->id,
            'event'          => $user->is_active ? 'user.activated' : 'user.deactivated',
            'auditable_type' => User::class,
            'auditable_id'   => $user->id,
            'new_values'     => ['is_active' => $user->is_active],
            'ip_address'     => $request->ip(),
        ]);

        return response()->json([
            'message'   => $user->is_active ? 'Utilisateur activé.' : 'Utilisateur désactivé.',
            'is_active' => $user->is_active,
        ]);
    }

    public function assignRole(Request $request, User $user): JsonResponse
    {
        $this->authorize('assignRole', $user);

        $validated = $request->validate([
            'role' => ['required', 'in:vendeur,responsable_boutique,admin_entreprise'],
        ]);

        $oldRole = $user->roles->first()?->name;
        $user->syncRoles([$validated['role']]);

        AuditLog::create([
            'tenant_id'      => $user->tenant_id,
            'user_id'        => $request->user()->id,
            'event'          => 'user.role_changed',
            'auditable_type' => User::class,
            'auditable_id'   => $user->id,
            'old_values'     => ['role' => $oldRole],
            'new_values'     => ['role' => $validated['role']],
            'ip_address'     => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Rôle mis à jour.',
            'role'    => $validated['role'],
        ]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'password' => ['required', Password::min(8)],
        ]);

        $user->update(['password' => Hash::make($validated['password'])]);
        $user->tokens()->delete();

        AuditLog::create([
            'tenant_id'      => $user->tenant_id,
            'user_id'        => $request->user()->id,
            'event'          => 'user.password_reset',
            'auditable_type' => User::class,
            'auditable_id'   => $user->id,
            'ip_address'     => $request->ip(),
        ]);

        return response()->json(['message' => 'Mot de passe réinitialisé.']);
    }
}
