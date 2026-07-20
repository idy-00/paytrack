<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\Payment\PaymentGatewayFactory;
use App\Services\Payment\PaymentRequest as GatewayPaymentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobilePaymentController extends Controller
{
    public function initiate(Request $request, Sale $sale): JsonResponse
    {
        $this->authorize('recordPayment', $sale);

        if (in_array($sale->status, ['solde', 'annule'])) {
            return response()->json(['message' => 'Vente déjà soldée ou annulée.'], 422);
        }

        // Construire la règle dynamiquement selon les gateways actifs
        $availableGateways = implode(',', PaymentGatewayFactory::available());

        $validated = $request->validate([
            'gateway' => ['required', "in:{$availableGateways}"],
            'phone'   => ['required', 'string', 'regex:/^\+?[0-9]{8,15}$/'],
            'amount'  => ['nullable', 'integer', 'min:1'],
        ]);

        $amount  = $validated['amount'] ?? $sale->installment_amount;
        $gateway = PaymentGatewayFactory::make($validated['gateway']);

        $paymentRequest = new GatewayPaymentRequest(
            amount:      $amount,
            phone:       $validated['phone'],
            reference:   $sale->reference,
            description: "Paiement tranche — {$sale->article_name}",
            callbackUrl: config('app.url') . "/api/webhooks/{$validated['gateway']}",
            returnUrl:   config('app.frontend_url', config('app.url')) . "/qr/{$sale->qr_uuid}",
            metadata:    ['sale_id' => $sale->id, 'tenant_id' => $sale->tenant_id],
        );

        $response = $gateway->initiate($paymentRequest);

        return response()->json([
            'success'           => $response->success,
            'gateway_reference' => $response->gatewayReference,
            'checkout_url'      => $response->checkoutUrl,
            'ussd_code'         => $response->ussdCode,
            'message'           => $response->message,
        ], $response->success ? 200 : 502);
    }

    public function status(Request $request, Sale $sale, string $reference): JsonResponse
    {
        $this->authorize('view', $sale);

        $validated = $request->validate([
            'gateway' => ['required', 'in:wave,orange_money,free_money'],
        ]);

        $gateway = PaymentGatewayFactory::make($validated['gateway']);
        $status  = $gateway->checkStatus($reference);

        return response()->json([
            'status'            => $status->status->value,
            'gateway_reference' => $status->gatewayReference,
            'message'           => $status->message,
        ]);
    }
}
