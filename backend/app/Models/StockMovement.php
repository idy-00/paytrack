<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockMovement extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'article_id', 'shop_id', 'user_id', 'type', 'quantity',
        'stock_before', 'stock_after', 'reason', 'moveable_type', 'moveable_id', 'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'stock_before' => 'integer',
        'stock_after' => 'integer',
    ];

    public function article() { return $this->belongsTo(Article::class); }
    public function shop() { return $this->belongsTo(Shop::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function moveable(): MorphTo { return $this->morphTo(); }

    public function isIn(): bool { return $this->type === 'in'; }
    public function isOut(): bool { return $this->type === 'out'; }

    public static function record(
        Article $article,
        string $type,
        int $quantity,
        string $reason,
        $moveable = null,
        ?int $userId = null,
        ?int $shopId = null,
        ?string $notes = null
    ): self {
        $stockBefore = $article->stock;
        $change = in_array($type, ['in', 'release']) ? abs($quantity) : -abs($quantity);
        $stockAfter = max(0, $stockBefore + $change);

        $article->update(['stock' => $stockAfter]);

        return static::create([
            'tenant_id' => $article->tenant_id,
            'article_id' => $article->id,
            'shop_id' => $shopId,
            'user_id' => $userId,
            'type' => $type,
            'quantity' => $change,
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter,
            'reason' => $reason,
            'moveable_type' => $moveable ? get_class($moveable) : null,
            'moveable_id' => $moveable?->id,
            'notes' => $notes,
        ]);
    }
}
