<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * AuditLog est append-only : aucun UPDATE ni DELETE autorisé.
 * Toute tentative de modification lève une exception.
 */
class AuditLog extends Model
{
    // Pas d'updated_at — log immuable
    const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id', 'user_id', 'event',
        'auditable_type', 'auditable_id',
        'old_values', 'new_values',
        'ip_address', 'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        // Bloquer toute modification — le log est immuable
        static::updating(fn() => throw new \RuntimeException(
            'AuditLog is append-only. Updates are not permitted.'
        ));
        static::deleting(fn() => throw new \RuntimeException(
            'AuditLog is append-only. Deletes are not permitted.'
        ));
    }

    public function user()   { return $this->belongsTo(User::class); }
    public function tenant() { return $this->belongsTo(Tenant::class); }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForEvent($query, string $event)
    {
        return $query->where('event', $event);
    }

    public function scopeRecent($query, int $limit = 50)
    {
        return $query->orderByDesc('created_at')->limit($limit);
    }
}
