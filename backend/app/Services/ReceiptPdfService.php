<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;

class ReceiptPdfService
{
    public function generatePaymentReceipt(Payment $payment): \Barryvdh\DomPDF\PDF
    {
        $payment->load(['sale.client', 'sale.shop', 'sale.tenant', 'recordedBy']);

        return Pdf::loadView('receipts.payment', [
            'payment' => $payment,
            'sale'    => $payment->sale,
            'client'  => $payment->sale->client,
            'shop'    => $payment->sale->shop,
            'tenant'  => $payment->sale->tenant,
        ])->setPaper('a5', 'portrait');
    }

    public function generateSaleReceipt(Sale $sale): \Barryvdh\DomPDF\PDF
    {
        $sale->load(['client', 'shop', 'tenant', 'schedules', 'payments', 'createdBy']);

        return Pdf::loadView('receipts.sale', [
            'sale'   => $sale,
            'client' => $sale->client,
            'shop'   => $sale->shop,
            'tenant' => $sale->tenant,
        ])->setPaper('a5', 'portrait');
    }
}
