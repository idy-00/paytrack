<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\Article;
use App\Services\PaytechService;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private function stockService(): StockService
    {
        return app(StockService::class);
    }

    private function paytechService(): PaytechService
    {
        return app(PaytechService::class);
    }

    public function index(Request $request)
    {
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
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'shop_id' => 'nullable|exists:shops,id',
            'payment_mode' => 'sometimes|in:comptant,tranche',
            'discount' => 'sometimes|integer|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.article_id' => 'required|exists:articles,id',
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
        $order->load(['client', 'createdBy', 'shop', 'items.article', 'payments.recordedBy']);
        return response()->json($order);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,preparing,ready,delivered,cancelled',
        ]);

        $oldStatus = $order->status;
        $newStatus = $validated['status'];

        // Handle stock on confirm
        if ($newStatus === 'confirmed' && $oldStatus === 'pending') {
            $this->stockService()->reserveForOrder($order);
        }

        // Handle cancellation
        if ($newStatus === 'cancelled' && in_array($oldStatus, ['confirmed', 'preparing', 'ready'])) {
            $this->stockService()->releaseOrderReservation($order);
        }

        // Handle delivery
        if ($newStatus === 'delivered') {
            $this->stockService()->deliverOrder($order);
            return response()->json(['message' => 'Commande livrée', 'order' => $order->fresh()]);
        }

        $order->update(['status' => $newStatus]);

        return response()->json(['message' => 'Statut mis à jour', 'order' => $order]);
    }

    public function recordPayment(Request $request, Order $order)
    {
        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'payment_method' => 'required|in:especes,wave,orange_money,free_money,card,wizall,emoney',
            'notes' => 'nullable|string',
        ]);

        if ($validated['amount'] > $order->remaining_amount) {
            return response()->json([
                'message' => 'Montant supérieur au reste à payer',
                'remaining' => $order->remaining_amount,
            ], 400);
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

        return response()->json([
            'message' => 'Paiement enregistré',
            'payment' => $payment,
            'order' => $order->fresh(),
        ], 201);
    }

    public function initiateOnlinePayment(Request $request, Order $order)
    {
        $validated = $request->validate([
            'amount' => 'sometimes|integer|min:1',
        ]);

        $amount = $validated['amount'] ?? $order->remaining_amount;

        if ($amount > $order->remaining_amount) {
            return response()->json(['message' => 'Montant supérieur au reste à payer'], 400);
        }

        if (!$this->paytechService()->isConfigured()) {
            return response()->json([
                'message' => 'Paiement en ligne non disponible',
                'code' => 'paytech_not_configured',
            ], 503);
        }

        $payment = $this->paytechService()->initiatePayment([
            'item_name' => "Commande {$order->reference}",
            'amount' => $amount,
            'reference' => $order->reference . '-' . time(),
            'description' => "Paiement commande {$order->reference}",
            'metadata' => [
                'type' => 'order_payment',
                'order_id' => $order->id,
                'tenant_id' => $order->tenant_id,
            ],
        ]);

        $order->update(['paytech_payment_ref' => $payment['token'] ?? null]);

        return response()->json([
            'payment_url' => $payment['redirect_url'] ?? $payment['payment_url'],
            'token' => $payment['token'] ?? null,
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
