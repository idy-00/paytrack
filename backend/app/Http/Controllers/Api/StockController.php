<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StockController extends Controller
{
    private function stockService(): StockService
    {
        return app(StockService::class);
    }

    public function overview(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $articles = Article::where('tenant_id', $tenantId)
            ->where('track_stock', true)
            ->where('is_active', true);

        return response()->json([
            'total_articles' => $articles->count(),
            'total_stock_value' => Article::where('tenant_id', $tenantId)
                ->where('is_active', true)
                ->selectRaw('SUM(stock * price) as value')
                ->value('value') ?? 0,
            'low_stock' => $this->stockService()->getLowStockArticles($tenantId)->count(),
            'out_of_stock' => $this->stockService()->getOutOfStockArticles($tenantId)->count(),
        ]);
    }

    public function movements(Request $request)
    {
        $query = StockMovement::with(['article', 'user', 'shop']);

        if ($articleId = $request->get('article_id')) {
            $query->where('article_id', $articleId);
        }

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        if ($from = $request->get('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->get('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(30));
    }

    public function adjustStock(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $validated = $request->validate([
            'article_id' => ['required', Rule::exists('articles', 'id')->where('tenant_id', $tenantId)],
            'quantity' => 'required|integer|not_in:0',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $article = Article::findOrFail($validated['article_id']);

        $type = $validated['quantity'] > 0 ? 'in' : 'out';

        StockMovement::record(
            $article,
            $type,
            abs($validated['quantity']),
            $validated['reason'],
            null,
            $request->user()->id,
            $request->user()->shop_id,
            $validated['notes']
        );

        return response()->json([
            'message' => 'Stock ajusté',
            'article' => $article->fresh(),
        ]);
    }

    public function alerts(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        return response()->json([
            'low_stock' => $this->stockService()->getLowStockArticles($tenantId),
            'out_of_stock' => $this->stockService()->getOutOfStockArticles($tenantId),
        ]);
    }

    public function topSelling(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $days = $request->get('days', 30);

        $top = StockMovement::where('tenant_id', $tenantId)
            ->where('type', 'out')
            ->where('reason', 'sale')
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('article_id, SUM(ABS(quantity)) as total_sold')
            ->groupBy('article_id')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->with('article')
            ->get();

        return response()->json($top);
    }

    // Inventories
    public function inventories(Request $request)
    {
        $query = Inventory::with(['createdBy', 'shop'])
            ->withCount('items');

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function createInventory(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $validated = $request->validate([
            'shop_id' => ['nullable', Rule::exists('shops', 'id')->where('tenant_id', $tenantId)],
            'notes' => 'nullable|string',
            'articles' => 'sometimes|array',
            'articles.*' => [Rule::exists('articles', 'id')->where('tenant_id', $tenantId)],
        ]);

        $inventory = DB::transaction(function () use ($validated, $request) {
            $inventory = Inventory::create([
                'tenant_id' => $request->user()->tenant_id,
                'shop_id' => $validated['shop_id'] ?? $request->user()->shop_id,
                'created_by' => $request->user()->id,
                'reference' => Inventory::generateReference(),
                'inventory_date' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            // Pre-populate with articles
            $articleIds = $validated['articles'] ?? Article::where('tenant_id', $request->user()->tenant_id)
                ->where('track_stock', true)
                ->where('is_active', true)
                ->pluck('id');

            foreach ($articleIds as $articleId) {
                $article = Article::find($articleId);
                if (!$article) continue;

                InventoryItem::create([
                    'inventory_id' => $inventory->id,
                    'article_id' => $articleId,
                    'expected_quantity' => $article->stock,
                    'counted_quantity' => $article->stock, // Default to expected
                    'difference' => 0,
                ]);
            }

            return $inventory;
        });

        return response()->json([
            'message' => 'Inventaire créé',
            'inventory' => $inventory->load('items.article'),
        ], 201);
    }

    public function showInventory(Inventory $inventory)
    {
        $inventory->load(['createdBy', 'shop', 'items.article']);
        return response()->json($inventory);
    }

    public function updateInventoryItem(Request $request, Inventory $inventory, InventoryItem $item)
    {
        if ($item->inventory_id !== $inventory->id) {
            return response()->json(['message' => 'Item non trouvé'], 404);
        }

        if ($inventory->isCompleted()) {
            return response()->json(['message' => 'Inventaire déjà finalisé'], 400);
        }

        $validated = $request->validate([
            'counted_quantity' => 'required|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        $item->update($validated);

        return response()->json([
            'message' => 'Comptage mis à jour',
            'item' => $item,
        ]);
    }

    public function completeInventory(Request $request, Inventory $inventory)
    {
        if ($inventory->isCompleted()) {
            return response()->json(['message' => 'Inventaire déjà finalisé'], 400);
        }

        $inventory->complete();

        return response()->json([
            'message' => 'Inventaire finalisé et stock ajusté',
            'inventory' => $inventory->fresh('items.article'),
        ]);
    }

    public function cancelInventory(Inventory $inventory)
    {
        if ($inventory->isCompleted()) {
            return response()->json(['message' => 'Impossible d\'annuler un inventaire finalisé'], 400);
        }

        $inventory->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Inventaire annulé']);
    }
}
