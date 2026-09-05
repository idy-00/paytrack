<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\Article;
use App\Services\DexpayService;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    private function stockService(): StockService
    {
        return app(StockService::class);
    }

    private function dexpayService(): DexpayService
    {
        return app(DexpayService::class);
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Order::class);
        $query = Order::with(['client', 'createdBy', 'shop'])
            ->withCount('items');

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($paymentStatus = $request->get('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhereHas('client', fn($c) => $c->where('full_name', 'like', "%{$search}%"));
            });
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function store(Request $request)
    {
        $this->authorize('create', Order::class);
        $tenantId = $request->user()->tenant_id;
        $validated = $request->validate([
            'client_id' => ['required', Rule::exists('clients', 'id')->where('tenant_id', $tenantId)],
            'shop_id' => ['nullable', Rule::exists('shops', 'id')->where('tenant_id', $tenantId)],
            'payment_mode' => 'sometimes|in:comptant,tranche',
            'discount' => 'sometimes|integer|min:0',
            'notes' => 'nullable|string',
            'delivery_date' => 'nullable|date|after_or_equal:today',
            'delivery_address' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.article_id' => ['required', Rule::exists('articles', 'id')->where('tenant_id', $tenantId)],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.discount' => 'sometimes|integer|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $order = Order::create([
                'tenant_id' => $request->user()->tenant_id,
                'shop_id' => $validated['shop_id'] ?? $request->user()->shop_id,
                'client_id' => $validated['client_id'],
                'created_by' => $request->user()->id,
                'payment_mode' => $validated['payment_mode'] ?? 'comptant',
                'discount' => $validated['discount'] ?? 0,
                'delivery_date' => $validated['delivery_date'] ?? null,
                'delivery_address' => $validated['delivery_address'] ?? null,
                'order_date' => now(),
                'subtotal' => 0,
                'total_amount' => 0,
                'remaining_amount' => 0,
            ]);

            $subtotal = 0;
            foreach ($validated['items'] as $itemData) {
                $article = Article::findOrFail($itemData['article_id']);
                $discount = $itemData['discount'] ?? 0;
                $totalPrice = ($article->price * $itemData['quantity']) - $discount;

                if ($discount > ($article->price * $itemData['quantity'])) {
                    abort(422, 'La remise d’un article ne peut pas dépasser son montant.');
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'article_id' => $article->id,
                    'article_name' => $article->name,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $article->price,
                    'discount' => $discount,
                    'total_price' => $totalPrice,
                ]);

                $subtotal += $totalPrice;
            }

            $totalAmount = max(0, $subtotal - ($validated['discount'] ?? 0));
            $order->update([
                'subtotal' => $subtotal,
                'total_amount' => $totalAmount,
                'remaining_amount' => $totalAmount,
            ]);

            return response()->json([
                'message' => 'Commande créée',
                'order' => $order->load(['items.article', 'client']),
            ], 201);
        });
    }

    public function show(Order $order)
    {
        $this->authorize('view', $order);
        $order->load(['client', 'createdBy', 'shop', 'items.article', 'payments.recordedBy']);
        return response()->json($order);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $this->authorize('update', $order);
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,preparing,ready,delivered,cancelled',
        ]);

        $newStatus = $validated['status'];
        $order = DB::transaction(function () use ($order, $newStatus) {
            $order = Order::with('items.article')->lockForUpdate()->findOrFail($order->id);
            if (! $order->canTransitionTo($newStatus)) {
                abort(422, "Transition {$order->status} → {$newStatus} non autorisée.");
            }
            if ($newStatus === 'confirmed') $this->stockService()->reserveForOrder($order);
            if ($newStatus === 'cancelled' && $order->status !== 'pending') $this->stockService()->releaseOrderReservation($order);
            if ($newStatus === 'delivered') $this->stockService()->deliverOrder($order);
            else $order->update(['status' => $newStatus]);
            return $order->fresh();
        });
        return response()->json(['message' => 'Statut mis à jour', 'order' => $order]);
    }

    public function recordPayment(Request $request, Order $order)
    {
        $this->authorize('recordPayment', $order);
        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'payment_method' => 'required|in:especes,wave,orange_money,free_money,card,wizall,emoney',
            'notes' => 'nullable|string',
        ]);

        [$payment, $order] = DB::transaction(function () use ($validated, $order, $request) {
            $order = Order::lockForUpdate()->findOrFail($order->id);
            if ($validated['amount'] > $order->remaining_amount) {
                abort(422, 'Montant supérieur au reste à payer.');
            }

            $payment = OrderPayment::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'recorded_by' => $request->user()->id,
                'receipt_number' => OrderPayment::generateReceiptNumber(),
                'amount' => $validated['amount'],
                'payment_date' => now(),
                'payment_method' => $validated['payment_method'],
                'source' => 'manual',
                'notes' => $validated['notes'],
            ]);
            $order->recalculateTotals();

            return [$payment, $order->fresh()];
        });

        return response()->json([
            'message' => 'Paiement enregistré',
            'payment' => $payment,
            'order' => $order->fresh(),
        ], 201);
    }

    public function initiateOnlinePayment(Request $request, Order $order)
    {
        $this->authorize('recordPayment', $order);
        $validated = $request->validate([
            'amount' => 'sometimes|integer|min:1',
            'success_url' => 'nullable|url',
            'cancel_url' => 'nullable|url',
        ]);

        $amount = $validated['amount'] ?? $order->remaining_amount;

        if ($amount > $order->remaining_amount) {
            return response()->json(['message' => 'Montant supérieur au reste à payer'], 400);
        }

        if (!$this->dexpayService()->isConfigured()) {
            return response()->json([
                'message' => 'Paiement en ligne non disponible',
                'code' => 'dexpay_not_configured',
            ], 503);
        }

        $baseUrl = config('app.frontend_url', config('app.url'));
        $checkout = $this->dexpayService()->createCheckoutSession([
            'item_name' => "Commande {$order->reference}",
            'amount' => $amount,
            'currency' => 'XOF',
            'reference' => "ORD-{$order->id}-" . time(),
            'description' => "Paiement commande {$order->reference}",
            'success_url' => $validated['success_url'] ?? "{$baseUrl}/payment/success",
            'failure_url' => $validated['cancel_url'] ?? "{$baseUrl}/payment/cancel",
            'webhook_url' => route('webhooks.dexpay'),
            'metadata' => [
                'type' => 'order_payment',
                'order_id' => $order->id,
                'tenant_id' => $order->tenant_id,
            ],
        ]);

        $paymentUrl = $checkout['payment_url']
            ?? $checkout['checkout_url']
            ?? $checkout['url']
            ?? $checkout['data']['payment_url']
            ?? $checkout['data']['url']
            ?? null;

        if (! $paymentUrl) {
            return response()->json([
                'message' => 'DexPay n’a pas retourné de lien de paiement.',
                'code' => 'dexpay_no_url',
            ], 502);
        }

        $order->update([
            'dexpay_checkout_id' => $checkout['id'] ?? $checkout['data']['id'] ?? null,
        ]);

        return response()->json([
            'payment_url' => $paymentUrl,
            'checkout_id' => $order->dexpay_checkout_id,
        ]);
    }

    public function publicQr(string $uuid)
    {
        $order = Order::where('qr_uuid', $uuid)
            ->with('client:id,full_name')
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Commande non trouvée'], 404);
        }

        // Masked data for public access
        $name = $order->client->full_name;
        $parts = explode(' ', $name);
        $maskedName = $parts[0] . (isset($parts[1]) ? ' ' . substr($parts[1], 0, 1) . '***' : '');

        return response()->json([
            'reference' => $order->reference,
            'client_name' => $maskedName,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'order_date' => $order->order_date->format('d/m/Y'),
        ]);
    }
}
