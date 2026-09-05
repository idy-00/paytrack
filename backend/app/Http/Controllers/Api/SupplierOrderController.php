<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\SupplierOrder;
use App\Models\SupplierOrderItem;
use App\Models\SupplierPayment;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SupplierOrderController extends Controller
{
    private function stockService(): StockService
    {
        return app(StockService::class);
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', SupplierOrder::class);
        $query = SupplierOrder::with(['supplier', 'createdBy', 'shop'])
            ->withCount('items');

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($supplierId = $request->get('supplier_id')) {
            $query->where('supplier_id', $supplierId);
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn($s) => $s->where('name', 'like', "%{$search}%"));
            });
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function store(Request $request)
    {
        $this->authorize('create', SupplierOrder::class);
        $tenantId = $request->user()->tenant_id;
        $validated = $request->validate([
            'supplier_id' => ['required', Rule::exists('suppliers', 'id')->where('tenant_id', $tenantId)],
            'shop_id' => ['nullable', Rule::exists('shops', 'id')->where('tenant_id', $tenantId)],
            'expected_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.article_id' => ['nullable', Rule::exists('articles', 'id')->where('tenant_id', $tenantId)],
            'items.*.article_name' => 'required|string|max:255',
            'items.*.quantity_ordered' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|integer|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $order = SupplierOrder::create([
                'tenant_id' => $request->user()->tenant_id,
                'shop_id' => $validated['shop_id'] ?? $request->user()->shop_id,
                'supplier_id' => $validated['supplier_id'],
                'created_by' => $request->user()->id,
                'reference' => SupplierOrder::generateReference(),
                'order_date' => now(),
                'expected_date' => $validated['expected_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'draft',
            ]);

            $total = 0;
            foreach ($validated['items'] as $itemData) {
                $totalPrice = $itemData['quantity_ordered'] * $itemData['unit_price'];

                SupplierOrderItem::create([
                    'supplier_order_id' => $order->id,
                    'article_id' => $itemData['article_id'] ?? null,
                    'article_name' => $itemData['article_name'],
                    'quantity_ordered' => $itemData['quantity_ordered'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $totalPrice,
                ]);

                $total += $totalPrice;
            }

            $order->update([
                'total_amount' => $total,
                'remaining_amount' => $total,
            ]);

            return response()->json([
                'message' => 'Commande fournisseur créée',
                'order' => $order->load(['items', 'supplier']),
            ], 201);
        });
    }

    public function show(SupplierOrder $supplierOrder)
    {
        $this->authorize('view', $supplierOrder);
        $supplierOrder->load(['supplier', 'createdBy', 'shop', 'items.article', 'payments.recordedBy']);
        return response()->json($supplierOrder);
    }

    public function updateStatus(Request $request, SupplierOrder $supplierOrder)
    {
        $this->authorize('update', $supplierOrder);
        $validated = $request->validate([
            'status' => 'required|in:draft,sent,partial_received,received,cancelled',
        ]);

        $supplierOrder->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Statut mis à jour',
            'order' => $supplierOrder,
        ]);
    }

    public function receiveItems(Request $request, SupplierOrder $supplierOrder)
    {
        $this->authorize('update', $supplierOrder);
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => ['required', Rule::exists('supplier_order_items', 'id')->where('supplier_order_id', $supplierOrder->id)],
            'items.*.quantity_received' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($validated, $supplierOrder, $request) {
            $supplierOrder = SupplierOrder::lockForUpdate()->findOrFail($supplierOrder->id);
            foreach ($validated['items'] as $itemData) {
                $item = SupplierOrderItem::lockForUpdate()->find($itemData['id']);
                if ($item->supplier_order_id !== $supplierOrder->id) continue;

                $qty = $itemData['quantity_received'];
                if ($qty > 0) {
                    $this->stockService()->receiveFromSupplier($item, $qty, $request->user()->id);
                }
            }
        });

        return response()->json([
            'message' => 'Réception enregistrée',
            'order' => $supplierOrder->fresh(['items.article']),
        ]);
    }

    public function recordPayment(Request $request, SupplierOrder $supplierOrder)
    {
        $this->authorize('update', $supplierOrder);
        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'payment_method' => 'required|in:especes,wave,orange_money,virement,cheque',
            'notes' => 'nullable|string',
        ]);

        [$payment, $supplierOrder] = DB::transaction(function () use ($validated, $supplierOrder, $request) {
            $supplierOrder = SupplierOrder::lockForUpdate()->findOrFail($supplierOrder->id);
            if ($validated['amount'] > $supplierOrder->remaining_amount) {
                abort(422, 'Montant supérieur au reste à payer.');
            }
            $payment = SupplierPayment::create([
                'tenant_id' => $supplierOrder->tenant_id,
                'supplier_order_id' => $supplierOrder->id,
                'recorded_by' => $request->user()->id,
                'reference' => SupplierPayment::generateReference(),
                'amount' => $validated['amount'],
                'payment_date' => now(),
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'],
            ]);
            $supplierOrder->recalculateTotals();
            return [$payment, $supplierOrder->fresh()];
        });

        return response()->json([
            'message' => 'Paiement enregistré',
            'payment' => $payment,
            'order' => $supplierOrder->fresh(),
        ], 201);
    }
}
