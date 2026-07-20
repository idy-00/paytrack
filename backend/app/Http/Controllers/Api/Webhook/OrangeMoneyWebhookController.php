<?php

namespace App\Http\Controllers\Api\Webhook;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessSuccessfulPayment;
use App\Models\AuditLog;
use App\Services\Payment\Gateways\OrangeMoneyGateway;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class OrangeMoneyWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $payload   = $request->getContent();
        $signature = $request->header('X-Signature', '');

        $gateway = app(OrangeMoneyGateway::class);

        if (! $gateway->verifyWebhook($payload, $signature)) {
            Log::warning('orange_money.webhook.invalid_signature', ['ip' => $request->ip()]);
            AuditLog::create([
                'event'      => 'webhook.orange_money.invalid_signature',
                'ip_address' => $request->ip(),
            ]);
            return response('', 200);
        }

        $body   = $request->json()->all();
        $status = $gateway->parseWebhook($body);

        Log::info('orange_money.webhook.received', [
            'status'    => $status->status->value,
            'reference' => $status->internalReference,
        ]);

        AuditLog::create([
            'event'      => 'webhook.orange_money.' . $status->status->value,
            'new_values' => [
                'gateway_ref'  => $status->gatewayReference,
                'internal_ref' => $status->internalReference,
                'amount'       => $status->amount,
            ],
            'ip_address' => $request->ip(),
        ]);

        if ($status->isSuccessful() && $status->internalReference) {
            ProcessSuccessfulPayment::dispatch(
                'orange_money',
                $status->gatewayReference,
                $status->internalReference,
                $status->amount,
            );
        }

        return response('', 200);
    }
}
