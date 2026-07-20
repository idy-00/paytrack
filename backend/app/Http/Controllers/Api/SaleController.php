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
            'total_amount'      => ['required', 'integer', 'min:1'],
            // Fix #5: down_payment must be strictly less than total_amount
            'down_payment'      => ['nullable', 'integer', 'min:0', 'max:' . max(0, $totalAmount - 1)],
            'installment_count' => ['required', 'integer', 'min:1', 'max:120'],
            'frequency'         => ['required', 'in:hebdomadaire,bimestriel,mensuel,trimestriel'],
            'start_date'        => ['required', 'date', 'after_or_equal:today'],
            'notes'             => ['nullable', 'string', 'max:2000'],
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $downPayment = $validated['down_payment'] ?? 0;
            $remaining   = $validated['total_amount'] - $downPayment;
            $installAmt  = (int) ceil($remaining / $validated['installment_count']);

            $startDate = \Carbon\Carbon::parse($validated['start_date']);
            $endDate   = match ($validated['frequency']) {
                'hebdomadaire' => $startDate->copy()->addWeeks($validated['installment_count']),
                'bimestriel'   => $startDate->copy()->addWeeks($validated['installment_count'] * 2),
                'mensuel'      => $startDate->copy()->addMonths($validated['installment_count']),
                'trimestriel'  => $startDate->copy()->addMonths($validated['installment_count'] * 3),
            };

            $sale = Sale::create([
                ...$validated,
                'created_by'       => $request->user()->id,
                // Fix #6: tenant-scoped sequence inside the transaction to avoid duplicate references
                'reference'        => $this->generateReference(),
                'qr_uuid'          => Str::uuid(),
                'down_payment'     => $downPayment,
                'paid_amount'      => $downPayment,
                'remaining_amount' => $remaining,
                'installment_amount' => $installAmt,
                'end_date'         => $endDate,
                'status'           => 'actif',
            ]);

            $sale->generateSchedule();

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
        });
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

    private function generateReference(): string
    {
        // Uses DB-level MAX for safe concurrency within the transaction
        $max = Sale::withoutGlobalScopes()->lockForUpdate()->max('id') ?? 0;
        return 'VT-' . date('Y') . '-' . str_pad($max + 1, 4, '0', STR_PAD_LEFT);
    }

    private function maskName(string $name): string
    {
        return collect(explode(' ', $name))->map(function ($part) {
            if (strlen($part) <= 2) return $part;
            return $part[0] . str_repeat('•', strlen($part) - 1);
        })->implode(' ');
    }
}
