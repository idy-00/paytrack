<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Client::class);
        $clients = Client::query()
            ->when($request->search, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->withCount(['sales', 'sales as active_sales_count' => fn($q) => $q->where('status', 'actif')])
            ->orderBy('full_name')
            ->paginate(50);

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Client::class);
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'phone'     => ['required', 'string', 'max:20'],
            'email'     => ['nullable', 'email', 'max:255'],
            'city'      => ['nullable', 'string', 'max:100'],
            'address'   => ['nullable', 'string', 'max:500'],
            'id_type'   => ['nullable', 'string', 'max:50'],
            'id_number' => ['nullable', 'string', 'max:50'],
            'notes'     => ['nullable', 'string', 'max:2000'],
        ]);

        $client = Client::create([...$validated, 'shop_id' => $request->user()->shop_id]);

        AuditLog::create([
            'tenant_id'      => $client->tenant_id,
            'user_id'        => $request->user()->id,
            'event'          => 'client.created',
            'auditable_type' => Client::class,
            'auditable_id'   => $client->id,
            'new_values'     => ['name' => $client->full_name, 'phone' => $client->phone],
            'ip_address'     => $request->ip(),
        ]);

        return response()->json($client, 201);
    }

    public function show(Client $client): JsonResponse
    {
        $this->authorize('view', $client);
        $client->load(['sales' => fn($q) => $q->latest()->limit(10)]);
        return response()->json($client);
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorize('update', $client);
        $validated = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone'     => ['sometimes', 'required', 'string', 'max:20'],
            'email'     => ['nullable', 'email', 'max:255'],
            'city'      => ['nullable', 'string', 'max:100'],
            'address'   => ['nullable', 'string', 'max:500'],
            'notes'     => ['nullable', 'string', 'max:2000'],
        ]);

        $oldValues = $client->only(array_keys($validated));
        $client->update($validated);

        AuditLog::create([
            'tenant_id'      => $client->tenant_id,
            'user_id'        => $request->user()->id,
            'event'          => 'client.updated',
            'auditable_type' => Client::class,
            'auditable_id'   => $client->id,
            'old_values'     => $oldValues,
            'new_values'     => $validated,
            'ip_address'     => $request->ip(),
        ]);

        return response()->json($client);
    }

    public function destroy(Client $client): JsonResponse
    {
        $this->authorize('delete', $client);
        if ($client->sales()->whereIn('status', ['actif', 'retard'])->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un client avec des ventes actives ou en retard.'
            ], 422);
        }

        $client->delete();

        return response()->json(['message' => 'Client supprimé.']);
    }
}
