<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::withCount('orders')
            ->withSum('orders', 'remaining_amount');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('active_only')) {
            $query->active();
        }

        return response()->json($query->orderBy('name')->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $supplier = Supplier::create([
            ...$validated,
            'tenant_id' => $request->user()->tenant_id,
        ]);

        return response()->json([
            'message' => 'Fournisseur créé',
            'supplier' => $supplier,
        ], 201);
    }

    public function show(Supplier $supplier)
    {
        $supplier->load(['orders' => fn($q) => $q->latest()->limit(10)]);
        $supplier->loadCount('orders');
        $supplier->loadSum('orders', 'remaining_amount');

        return response()->json($supplier);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $supplier->update($validated);

        return response()->json([
            'message' => 'Fournisseur mis à jour',
            'supplier' => $supplier,
        ]);
    }

    public function destroy(Supplier $supplier)
    {
        if ($supplier->orders()->whereIn('status', ['draft', 'sent', 'partial_received'])->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer: commandes en cours',
            ], 400);
        }

        $supplier->delete();

        return response()->json(['message' => 'Fournisseur supprimé']);
    }

    public function debts(Request $request)
    {
        $suppliers = Supplier::where('is_active', true)
            ->whereHas('orders', fn($q) => $q->where('remaining_amount', '>', 0))
            ->withSum('orders', 'remaining_amount')
            ->orderByDesc('orders_sum_remaining_amount')
            ->get();

        return response()->json([
            'suppliers' => $suppliers,
            'total_debt' => $suppliers->sum('orders_sum_remaining_amount'),
        ]);
    }
}
