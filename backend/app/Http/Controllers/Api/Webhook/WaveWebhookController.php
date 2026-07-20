<?php

namespace App\Http\Controllers\Api\Webhook;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessSuccessfulPayment;
use App\Models\AuditLog;
use App\Services\Payment\Exceptions\InvalidWebhookSignature;
use App\Services\Payment\Gateways\WaveGateway;
use App\Services\Payment\PaymentStatusEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WaveWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $payload   = $request->getContent();
        $signature = $request->header('Wave-Signature', '');

        $gateway = app(WaveGateway::class);

        if (! $gateway->verifyWebhook($payload, $signature)) {
            Log::warning('wave.webhook.invalid_signature', [
                'ip' => $request->ip(),
            ]);
            // Always return 200 to Wave even on failure — prevents endless retries
            // but log for investigation
            AuditLog::create([
                'event'      => 'webhook.wave.invalid_signature',
                'new_values' => ['ip' => $request->ip()],
                'ip_address' => $request->ip(),
            ]);
            return response('', 200);
        }

        $body   = $request->json()->all();
        $status = $gateway->parseWebhook($body);

        Log::info('wave.webhook.received', [
            'status'    => $status->status->value,
            'reference' => $status->internalReference,
        ]);

        AuditLog::create([
            'event'      => 'webhook.wave.' . $status->status->value,
            'new_values' => [
                'gateway_ref'  => $status->gatewayReference,
                'internal_ref' => $status->internalReference,
                'amount'       => $status->amount,
            ],
            'ip_address' => $request->ip(),
        ]);

        if ($status->isSuccessful() && $status->internalReference) {
            ProcessSuccessfulPayment::dispatch(
                'wave',
                $status->gatewayReference,
                $status->internalReference,
                $status->amount,
            );
        }

        return response('', 200);
    }
}
