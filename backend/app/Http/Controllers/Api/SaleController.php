<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SaleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->hasRole('client')) {
            $sales = Sale::with(['client', 'article', 'schedules', 'payments'])
                ->whereHas('client', fn ($query) => $query->where('user_id', $request->user()->id))
                ->orderByDesc('created_at')->paginate(20);
            return response()->json($sales);
        }
        $this->authorize('viewAny', Sale::class);

        $sales = Sale::with(['client', 'article', 'schedules'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->search, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('reference', 'like', "%{$search}%")
                      ->orWhereHas('client', fn($q) => $q->where('full_name', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($sales);
    }

    public function show(Sale $sale): JsonResponse
    {
        $this->authorize('view', $sale);
        $sale->load(['client', 'article', 'schedules', 'payments.recordedBy']);
        return response()->json($sale);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Sale::class);

        $tenantId = $request->user()->tenant_id;
        $totalAmount = (int) $request->input('total_amount', 0);

        $validated = $request->validate([
            // Fix #2: tenant-scoped exists() to prevent cross-tenant client/article injection
            'client_id'  => [
                'required',
                Rule::exists('clients', 'id')->where('tenant_id', $tenantId),
            ],
            'article_id' => [
                'nullable',
                Rule::exists('articles', 'id')->where('tenant_id', $tenantId),
            ],
            'article_name'      => ['required', 'string', 'max:255'],
            'quantity'          => ['nullable', 'integer', 'min:1', 'max:10000'],
            'total_amount'      => ['required', 'integer', 'min:1'],
            'down_payment'      => ['nullable', 'integer', 'min:0', 'max:' . $totalAmount],
            'payment_mode'      => ['nullable', 'in:tranche,comptant'],
            'installment_count' => ['required', 'integer', 'min:1', 'max:120'],
            'frequency'         => ['required', 'in:quotidien,hebdomadaire,bimestriel,mensuel,trimestriel,personnalise'],
            'custom_interval_days' => ['nullable', 'required_if:frequency,personnalise', 'integer', 'min:1', 'max:365'],
            'start_date'        => ['required', 'date', 'after_or_equal:today'],
            'notes'             => ['nullable', 'string', 'max:2000'],
        ]);

        // Concurrent sales may deadlock while competing for the same stock row.
        // Laravel retries the complete transaction, then the conditional decrement
        // returns the normal 422 response when stock is no longer sufficient.
        return DB::transaction(function () use ($validated, $request) {
            $isCash = ($validated['payment_mode'] ?? 'tranche') === 'comptant';
            $downPayment = $validated['down_payment'] ?? 0;
            if (! $isCash && $downPayment >= $validated['total_amount']) {
                abort(422, 'L’acompte doit être inférieur au montant total pour une vente par tranche.');
            }
            $remaining   = $validated['total_amount'] - $downPayment;
            $installAmt  = (int) ceil($remaining / $validated['installment_count']);

            $startDate = \Carbon\Carbon::parse($validated['start_date']);
            $endDate   = match ($validated['frequency']) {
                'hebdomadaire' => $startDate->copy()->addWeeks($validated['installment_count']),
                'bimestriel'   => $startDate->copy()->addWeeks($validated['installment_count'] * 2),
                'mensuel'      => $startDate->copy()->addMonths($validated['installment_count']),
                'trimestriel'  => $startDate->copy()->addMonths($validated['installment_count'] * 3),
                'quotidien'    => $startDate->copy()->addDays($validated['installment_count']),
                'personnalise' => $startDate->copy()->addDays($validated['installment_count'] * $validated['custom_interval_days']),
            };

            $sale = Sale::create([
                ...$validated,
                'created_by'       => $request->user()->id,
                'shop_id'          => $request->user()->shop_id,
                // Fix #6: tenant-scoped sequence inside the transaction to avoid duplicate references
                'reference'        => 'VT-' . now()->format('Y') . '-' . Str::ulid(),
                'qr_uuid'          => Str::uuid(),
                'down_payment'     => $downPayment,
                'paid_amount'      => $isCash ? $validated['total_amount'] : $downPayment,
                'remaining_amount' => $isCash ? 0 : $remaining,
                'installment_amount' => $installAmt,
                'end_date'         => $endDate,
                'status'           => $isCash ? 'solde' : 'actif',
            ]);

            if (! $isCash) $sale->generateSchedule();

            if ($sale->article_id) {
                $quantity = $validated['quantity'] ?? 1;
                $updated = \App\Models\Article::whereKey($sale->article_id)
                    ->where('stock', '>=', $quantity)
                    ->decrement('stock', $quantity);
                if (! $updated) abort(422, 'Article indisponible.');
            }

            AuditLog::create([
                'tenant_id'      => $sale->tenant_id,
                'user_id'        => $request->user()->id,
                'event'          => 'sale.created',
                'auditable_type' => Sale::class,
                'auditable_id'   => $sale->id,
                'new_values'     => ['reference' => $sale->reference, 'total' => $sale->total_amount],
                'ip_address'     => $request->ip(),
            ]);

            return response()->json($sale->load(['client', 'schedules']), 201);
        }, 3);
    }

    // Public QR endpoint — minimal, no auth required
    public function publicQr(string $uuid): JsonResponse
    {
        // withoutGlobalScopes() needed: no tenant context on this public route
        $sale = Sale::withoutGlobalScopes()->with('client')->where('qr_uuid', $uuid)->firstOrFail();

        return response()->json([
            'reference'   => $sale->reference,
            'status'      => $sale->status,
            'client_name' => $this->maskName($sale->client->full_name),
            'article'     => $sale->article_name,
            // Intentionally no amounts, phone, email, payment history
        ]);
    }

    private function maskName(string $name): string
    {
        return collect(explode(' ', $name))->map(function ($part) {
            if (strlen($part) <= 2) return $part;
            return $part[0] . str_repeat('•', strlen($part) - 1);
        })->implode(' ');
    }
}
