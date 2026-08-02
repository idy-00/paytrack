<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Shop::class);

        $shops = Shop::withCount(['users', 'clients', 'sales'])
            ->orderBy('name')
            ->get();

        return response()->json($shops);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Shop::class);

        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'city'    => ['nullable', 'string', 'max:100'],
            'phone'   => ['nullable', 'string', 'max:20'],
        ]);

        $shop = Shop::create($validated);

        AuditLog::create([
            'tenant_id'      => $shop->tenant_id,
            'user_id'        => $request->user()->id,
            'event'          => 'shop.created',
            'auditable_type' => Shop::class,
            'auditable_id'   => $shop->id,
            'new_values'     => ['name' => $shop->name],
            'ip_address'     => $request->ip(),
        ]);

        return response()->json($shop, 201);
    }

    public function show(Shop $shop): JsonResponse
    {
        $this->authorize('view', $shop);
        $shop->loadCount(['users', 'clients', 'sales']);
        return response()->json($shop);
    }

    public function update(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('update', $shop);

        $validated = $request->validate([
            'name'      => ['sometimes', 'required', 'string', 'max:255'],
            'address'   => ['nullable', 'string', 'max:500'],
            'city'      => ['nullable', 'string', 'max:100'],
            'phone'     => ['nullable', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $oldValues = $shop->only(array_keys($validated));
        $shop->update($validated);

        AuditLog::create([
            'tenant_id'      => $shop->tenant_id,
            'user_id'        => $request->user()->id,
            'event'          => 'shop.updated',
            'auditable_type' => Shop::class,
            'auditable_id'   => $shop->id,
            'old_values'     => $oldValues,
            'new_values'     => $validated,
            'ip_address'     => $request->ip(),
        ]);

        return response()->json($shop);
    }

    public function destroy(Shop $shop): JsonResponse
    {
        $this->authorize('delete', $shop);

        if ($shop->sales()->whereIn('status', ['actif', 'retard'])->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer une boutique avec des ventes actives.',
            ], 422);
        }

        $shop->delete();

        return response()->json(['message' => 'Boutique supprimée.']);
    }
}
