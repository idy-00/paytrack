<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;

/**
 * Auto-scope all queries to the current tenant.
 * Apply to every model that has a tenant_id column.
 *
 * SÉCURITÉ : Ce scope dépend du binding 'current_tenant_id' dans le container IoC,
 * posé par EnsureTenantAccess middleware.
 *
 * Si current_tenant_id est ABSENT (route hors middleware, job, super_admin),
 * le scope ne filtre pas — c'est intentionnel pour les jobs et super_admin,
 * mais accidentel pour les routes business = FAILLE.
 *
 * En production, surveiller les logs 'tenant.scope.missing' pour détecter
 * toute route qui atteindrait un modèle sans tenant context.
 */
trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        // ── Auto-inject tenant_id on create ──────────────────────────────────
        static::creating(function ($model) {
            if (! $model->tenant_id && app()->has('current_tenant_id')) {
                $model->tenant_id = app('current_tenant_id');
            }

            // Alerte si un enregistrement est créé sans tenant_id hors contexte connu
            if (! $model->tenant_id && ! app()->has('current_tenant_id') && ! app()->runningInConsole()) {
                Log::warning('BelongsToTenant: creating record without tenant context', [
                    'model' => get_class($model),
                    'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5),
                ]);
            }
        });

        // ── Auto-scope queries ────────────────────────────────────────────────
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (app()->has('current_tenant_id')) {
                // Scope actif — filtrage par tenant
                $builder->where($builder->getModel()->getTable() . '.tenant_id', app('current_tenant_id'));
                return;
            }

            // current_tenant_id absent :
            // - Route publique avec withoutGlobalScopes() → déjà géré, n'atteint pas ici
            // - Job queue (runningInConsole) → intentionnel
            // - super_admin → intentionnel (voit tout)
            // - Route oubliée hors middleware → FAILLE — logger en non-console
            if (! app()->runningInConsole()) {
                $model = $builder->getModel();
                Log::warning('BelongsToTenant: query on tenant-scoped model without tenant context', [
                    'model' => get_class($model),
                    'table' => $model->getTable(),
                    // Ne pas logguer la requête SQL complète (pourrait contenir des données)
                ]);
                // En production, on pourrait ajouter une clause impossible pour fail-safe :
                // $builder->whereRaw('1 = 0'); // bloquer toutes les requêtes sans tenant
                // Commenté car cela casserait super_admin — activer si super_admin a son propre bypass explicite
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }
}
