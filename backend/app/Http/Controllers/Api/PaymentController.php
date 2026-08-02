<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\SaleSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function store(Request $request, Sale $sale): JsonResponse
    {
        $this->authorize('recordPayment', $sale);

        // Pre-flight status check before acquiring the lock
        if (in_array($sale->status, ['solde', 'annule'])) {
            return response()->json(['message' => 'Cette vente est déjà soldée ou annulée.'], 422);
        }

        $validated = $request->validate([
            // Max is a loose guard — the transaction re-validates with a DB lock (fix #1)
            'amount'         => ['required', 'integer', 'min:1'],
            'payment_date'   => ['required', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', 'in:especes,wave,orange_money,free_money,virement,cheque'],
            'payment_type'   => ['required', 'in:acompte,tranche,solde,partiel'],
            // Fix #3: constrain schedule to the current sale only
            'schedule_id'    => [
                'nullable',
                Rule::exists('sale_schedules', 'id')->where('sale_id', $sale->id),
            ],
            'notes'          => ['nullable', 'string', 'max:1000'],
        ]);

        return DB::transaction(function () use ($validated, $sale, $request) {
            // Fix #1: re-fetch with write lock to prevent TOCTOU race condition
            $sale = Sale::lockForUpdate()->findOrFail($sale->id);

            if ($sale->status === 'solde' || $sale->status === 'annule') {
                throw ValidationException::withMessages([
                    'amount' => ['Cette vente est déjà soldée ou annulée.'],
                ]);
            }

            if ($validated['amount'] > $sale->remaining_amount) {
                throw ValidationException::withMessages([
                    'amount' => ['Le montant saisi dépasse le solde restant (' . $sale->remaining_amount . ' FCFA).'],
                ]);
            }

            $payment = Payment::create([
                'tenant_id'        => $sale->tenant_id,
                'sale_id'          => $sale->id,
                'sale_schedule_id' => $validated['schedule_id'] ?? null,
                'recorded_by'      => $request->user()->id,
                'receipt_number'   => 'RC-' . strtoupper(Str::random(8)),
                'amount'           => $validated['amount'],
                'payment_date'     => $validated['payment_date'],
                'payment_method'   => $validated['payment_method'],
                'payment_type'     => $validated['payment_type'],
                'notes'            => $validated['notes'] ?? null,
            ]);

            $newPaid      = $sale->paid_amount + $validated['amount'];
            $newRemaining = $sale->total_amount - $newPaid;
            $newStatus    = $newRemaining <= 0 ? 'solde' : $sale->status;

            $sale->update([
                'paid_amount'      => $newPaid,
                'remaining_amount' => max(0, $newRemaining),
                'status'           => $newStatus,
            ]);

            if (!empty($validated['schedule_id'])) {
                // Fix #3: query is already sale-scoped; this is a safe, direct find
                SaleSchedule::find($validated['schedule_id'])?->update([
                    'status'      => 'paye',
                    'paid_date'   => $validated['payment_date'],
                    'paid_amount' => $validated['amount'],
                ]);
            }

            AuditLog::create([
                'tenant_id'      => $sale->tenant_id,
                'user_id'        => $request->user()->id,
                'event'          => 'payment.created',
                'auditable_type' => Sale::class,
                'auditable_id'   => $sale->id,
                'new_values'     => ['amount' => $validated['amount'], 'receipt' => $payment->receipt_number],
                'ip_address'     => $request->ip(),
            ]);

            return response()->json([
                'payment' => $payment,
                'sale'    => $sale->fresh(['schedules', 'payments']),
            ], 201);
        });
    }
}
