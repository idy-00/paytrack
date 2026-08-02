<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function sales(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Sale::class);

        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date'   => ['nullable', 'date', 'after_or_equal:start_date'],
            'status'     => ['nullable', 'in:actif,retard,litige,solde,annule'],
        ]);

        $query = Sale::with(['client', 'shop', 'createdBy'])
            ->when($validated['start_date'] ?? null, fn($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($validated['end_date'] ?? null, fn($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->when($validated['status'] ?? null, fn($q, $s) => $q->where('status', $s))
            ->orderByDesc('created_at');

        $filename = 'ventes-' . now()->format('Y-m-d') . '.csv';

        return $this->streamCsv($filename, function () use ($query) {
            $headers = ['Référence', 'Date', 'Client', 'Téléphone', 'Article', 'Total', 'Payé', 'Reste', 'Statut', 'Boutique', 'Vendeur'];
            yield $headers;

            foreach ($query->cursor() as $sale) {
                yield [
                    $sale->reference,
                    $sale->created_at->format('d/m/Y'),
                    $sale->client?->full_name,
                    $sale->client?->phone,
                    $sale->article_name,
                    $sale->total_amount,
                    $sale->paid_amount,
                    $sale->remaining_amount,
                    $sale->status,
                    $sale->shop?->name,
                    $sale->createdBy?->name,
                ];
            }
        });
    }

    public function payments(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Payment::class);

        $validated = $request->validate([
            'start_date'     => ['nullable', 'date'],
            'end_date'       => ['nullable', 'date', 'after_or_equal:start_date'],
            'payment_method' => ['nullable', 'in:especes,wave,orange_money,free_money,virement,cheque'],
        ]);

        $query = Payment::with(['sale.client', 'sale.shop', 'recordedBy'])
            ->when($validated['start_date'] ?? null, fn($q, $d) => $q->whereDate('payment_date', '>=', $d))
            ->when($validated['end_date'] ?? null, fn($q, $d) => $q->whereDate('payment_date', '<=', $d))
            ->when($validated['payment_method'] ?? null, fn($q, $m) => $q->where('payment_method', $m))
            ->orderByDesc('payment_date');

        $filename = 'paiements-' . now()->format('Y-m-d') . '.csv';

        return $this->streamCsv($filename, function () use ($query) {
            $headers = ['N° Reçu', 'Date', 'Réf. Vente', 'Client', 'Montant', 'Mode', 'Type', 'Boutique', 'Enregistré par'];
            yield $headers;

            foreach ($query->cursor() as $payment) {
                yield [
                    $payment->receipt_number,
                    $payment->payment_date->format('d/m/Y'),
                    $payment->sale?->reference,
                    $payment->sale?->client?->full_name,
                    $payment->amount,
                    $payment->payment_method,
                    $payment->payment_type,
                    $payment->sale?->shop?->name,
                    $payment->recordedBy?->name,
                ];
            }
        });
    }

    public function overdueSchedules(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Sale::class);

        $query = Sale::with(['client', 'shop', 'schedules' => fn($q) => $q->overdue()])
            ->whereIn('status', ['actif', 'retard'])
            ->whereHas('schedules', fn($q) => $q->overdue())
            ->orderByDesc('created_at');

        $filename = 'retards-' . now()->format('Y-m-d') . '.csv';

        return $this->streamCsv($filename, function () use ($query) {
            $headers = ['Réf. Vente', 'Client', 'Téléphone', 'Article', 'Échéance', 'Montant dû', 'Jours retard', 'Boutique'];
            yield $headers;

            foreach ($query->cursor() as $sale) {
                foreach ($sale->schedules as $schedule) {
                    yield [
                        $sale->reference,
                        $sale->client?->full_name,
                        $sale->client?->phone,
                        $sale->article_name,
                        $schedule->due_date->format('d/m/Y'),
                        $schedule->amount,
                        now()->diffInDays($schedule->due_date),
                        $sale->shop?->name,
                    ];
                }
            }
        });
    }

    private function streamCsv(string $filename, callable $generator): StreamedResponse
    {
        return new StreamedResponse(function () use ($generator) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            foreach ($generator() as $row) {
                fputcsv($handle, $row, ';');
            }

            fclose($handle);
        }, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'no-cache',
        ]);
    }
}
