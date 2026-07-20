<?php

namespace App\Jobs;

use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\Sale;
use App\Notifications\PaymentReceivedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Fired by webhook controllers when a mobile money payment succeeds.
 * Idempotent: checks gateway_reference before creating a payment to prevent duplicates.
 */
class ProcessSuccessfulPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30; // seconds between retries

    public function __construct(
        public readonly string  $gateway,
        public readonly string  $gatewayReference,
        public readonly string  $saleReference,
        public readonly ?int    $amount,
    ) {}

    public function handle(): void
    {
        // Find the sale by reference (withoutGlobalScopes — no tenant context in queue)
        $sale = Sale::withoutGlobalScopes()
            ->where('reference', $this->saleReference)
            ->first();

        if (! $sale) {
            Log::error('ProcessSuccessfulPayment: sale not found', [
                'reference' => $this->saleReference,
            ]);
            return;
        }

        DB::transaction(function () use ($sale) {
            // Re-fetch the sale under an exclusive row lock to prevent concurrent processing
            $sale = Sale::withoutGlobalScopes()->lockForUpdate()->findOrFail($sale->id);

            // Idempotency check INSIDE the lock — prevents double-credit race condition
            $alreadyProcessed = Payment::withoutGlobalScopes()
                ->where('sale_id', $sale->id)
                ->where('payment_method', $this->gateway)
                ->whereRaw("JSON_EXTRACT(notes, '$.gateway_ref') = ?", [$this->gatewayReference])
                ->exists();

            if ($alreadyProcessed) {
                Log::info('ProcessSuccessfulPayment: already processed, skipping', [
                    'gateway_ref' => $this->gatewayReference,
                ]);
                return;
            }

            if (in_array($sale->status, ['solde', 'annule'])) {
                Log::info('ProcessSuccessfulPayment: sale already settled', [
                    'sale' => $sale->reference,
                ]);
                return;
            }

            $amount = $this->amount ?? $sale->installment_amount;

            // Cap to remaining balance
            if ($amount > $sale->remaining_amount) {
                $amount = $sale->remaining_amount;
            }

            // tenant_id is excluded from $fillable (BelongsToTenant); set it directly
            // because queue jobs run without a bound current_tenant_id in the container.
            $payment = new Payment([
                'sale_id'        => $sale->id,
                'recorded_by'    => $sale->created_by,
                'receipt_number' => 'MM-' . $this->gateway . '-' . strtoupper(Str::random(6)),
                'amount'         => $amount,
                'payment_date'   => now()->toDateString(),
                'payment_type'   => 'tranche',
                'payment_method' => $this->gateway,
                'notes'          => json_encode(['gateway_ref' => $this->gatewayReference]),
            ]);
            $payment->tenant_id = $sale->tenant_id;
            $payment->save();

            $newPaid      = $sale->paid_amount + $amount;
            $newRemaining = $sale->total_amount - $newPaid;
            $newStatus    = $newRemaining <= 0 ? 'solde' : $sale->status;

            $sale->update([
                'paid_amount'      => $newPaid,
                'remaining_amount' => max(0, $newRemaining),
                'status'           => $newStatus,
            ]);

            AuditLog::create([
                'tenant_id'      => $sale->tenant_id,
                'event'          => 'payment.mobile_money.success',
                'auditable_type' => Sale::class,
                'auditable_id'   => $sale->id,
                'new_values'     => [
                    'gateway'     => $this->gateway,
                    'gateway_ref' => $this->gatewayReference,
                    'amount'      => $amount,
                    'receipt'     => $payment->receipt_number,
                ],
            ]);

            // Notify client + vendor
            $sale->client->notify(new PaymentReceivedNotification($sale, $payment));
        });
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('ProcessSuccessfulPayment failed permanently', [
            'gateway'   => $this->gateway,
            'reference' => $this->saleReference,
            'error'     => $exception->getMessage(),
        ]);
    }
}
