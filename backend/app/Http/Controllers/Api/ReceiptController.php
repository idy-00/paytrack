<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Sale;
use App\Services\ReceiptPdfService;
use Illuminate\Http\Response;

class ReceiptController extends Controller
{
    public function __construct(protected ReceiptPdfService $pdfService)
    {
    }

    public function saleReceipt(Sale $sale): Response
    {
        $this->authorize('view', $sale);

        $pdf = $this->pdfService->generateSaleReceipt($sale);
        $filename = "contrat-{$sale->reference}.pdf";

        return $pdf->download($filename);
    }

    public function paymentReceipt(Payment $payment): Response
    {
        $this->authorize('view', $payment);

        $pdf = $this->pdfService->generatePaymentReceipt($payment);
        $filename = "recu-{$payment->receipt_number}.pdf";

        return $pdf->download($filename);
    }
}
