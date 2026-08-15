<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\StockMovement;
use App\Models\SupplierOrder;
use App\Models\SupplierOrderItem;
use Illuminate\Support\Facades\DB;

class StockService
{
    public function receiveFromSupplier(SupplierOrderItem $item, int $quantity, ?int $userId = null): void
    {
        if ($quantity <= 0) return;
        if (!$item->article) return;

        DB::transaction(function () use ($item, $quantity, $userId) {
            StockMovement::record(
                $item->article,
                'in',
                $quantity,
                'supplier_receipt',
                $item->order,
                $userId,
                $item->order->shop_id,
                "Réception fournisseur: {$item->article_name}"
            );

            $item->increment('quantity_received', $quantity);

            // Check if all items received
            $order = $item->order;
            $allReceived = $order->items->every(fn($i) => $i->isFullyReceived());
            if ($allReceived) {
                $order->markReceived();
            } elseif ($order->status === 'sent') {
                $order->update(['status' => 'partial_received']);
            }
        });
    }

    public function reserveForOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if (!$item->article || !$item->article->track_stock) continue;

                $article = $item->article;
                $available = $article->stock - $article->stock_reserved;

                if ($available < $item->quantity) {
                    throw new \Exception("Stock insuffisant pour {$article->name}");
                }

                $article->increment('stock_reserved', $item->quantity);

                StockMovement::record(
                    $article,
                    'reservation',
                    -$item->quantity,
                    'order_reserved',
                    $order,
                    auth()->id(),
                    $order->shop_id,
                    "Réservation commande {$order->reference}"
                );
            }
        });
    }

    public function releaseOrderReservation(Order $order): void
    {
        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if (!$item->article || !$item->article->track_stock) continue;

                $article = $item->article;
                $article->decrement('stock_reserved', min($item->quantity, $article->stock_reserved));

                StockMovement::record(
                    $article,
                    'release',
                    $item->quantity,
                    'order_cancelled',
                    $order,
                    auth()->id(),
                    $order->shop_id,
                    "Annulation commande {$order->reference}"
                );
            }
        });
    }

    public function deliverOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if (!$item->article || !$item->article->track_stock) continue;

                $article = $item->article;

                // Release reservation and deduct from stock
                $article->decrement('stock_reserved', min($item->quantity, $article->stock_reserved));
                $article->decrement('stock', $item->quantity);

                StockMovement::record(
                    $article,
                    'out',
                    $item->quantity,
                    'sale',
                    $order,
                    auth()->id(),
                    $order->shop_id,
                    "Livraison commande {$order->reference}"
                );
            }

            $order->update([
                'status' => 'delivered',
                'delivery_date' => now(),
            ]);
        });
    }

    public function getAvailableStock(Article $article): int
    {
        return max(0, $article->stock - $article->stock_reserved);
    }

    public function getLowStockArticles(int $tenantId): \Illuminate\Database\Eloquent\Collection
    {
        return Article::where('tenant_id', $tenantId)
            ->where('track_stock', true)
            ->where('is_active', true)
            ->whereRaw('stock <= stock_alert_threshold')
            ->get();
    }

    public function getOutOfStockArticles(int $tenantId): \Illuminate\Database\Eloquent\Collection
    {
        return Article::where('tenant_id', $tenantId)
            ->where('track_stock', true)
            ->where('is_active', true)
            ->where('stock', 0)
            ->get();
    }
}
