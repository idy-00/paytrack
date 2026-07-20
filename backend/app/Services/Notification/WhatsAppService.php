<?php

namespace App\Services\Notification;

use App\Services\Notification\Templates\MessageTemplates;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * WhatsApp Business API service.
 * Supports two modes:
 *   - Meta Cloud API (direct — requires Meta Business account)
 *   - Twilio WhatsApp (uses same Twilio credentials, prefixes 'whatsapp:')
 *
 * Required .env (Meta Cloud API mode):
 *   WHATSAPP_PROVIDER=meta              # 'meta' or 'twilio'
 *   WHATSAPP_META_ACCESS_TOKEN=         # Meta system user token
 *   WHATSAPP_META_PHONE_ID=             # Meta phone number ID
 *   WHATSAPP_META_VERSION=v19.0
 *
 * Required .env (Twilio mode):
 *   WHATSAPP_PROVIDER=twilio
 *   TWILIO_ACCOUNT_SID=...              # Shared with TwilioSmsService
 *   TWILIO_AUTH_TOKEN=...
 *   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   # Twilio Sandbox or approved number
 *
 * Template messages (pre-approved by Meta) for business-initiated conversations.
 */
class WhatsAppService implements NotificationServiceInterface
{
    private string $provider;
    private string $lang;

    // Meta Cloud API
    private string $metaToken;
    private string $metaPhoneId;
    private string $metaVersion;

    // Twilio WA
    private string $twilioSid;
    private string $twilioToken;
    private string $twilioFrom;

    public function __construct()
    {
        $this->provider    = config('services.whatsapp.provider', 'meta');
        $this->lang        = config('paytrack.notification_lang', 'fr');

        $this->metaToken   = config('services.whatsapp.meta.access_token', '');
        $this->metaPhoneId = config('services.whatsapp.meta.phone_id', '');
        $this->metaVersion = config('services.whatsapp.meta.version', 'v19.0');

        $this->twilioSid   = config('services.twilio.account_sid', '');
        $this->twilioToken = config('services.twilio.auth_token', '');
        $this->twilioFrom  = config('services.twilio.whatsapp_from', 'whatsapp:+14155238886');
    }

    public function send(string $to, string $template, array $variables = []): NotificationResult
    {
        return $this->provider === 'twilio'
            ? $this->sendViaTwilio($to, $template, $variables)
            : $this->sendViaMeta($to, $template, $variables);
    }

    public function sendBulk(array $recipients, string $template, array $variables = []): array
    {
        return array_map(
            fn($r) => $this->send($r, $template, $variables),
            $recipients
        );
    }

    private function sendViaMeta(string $to, string $templateKey, array $variables): NotificationResult
    {
        if (empty($this->metaToken) || empty($this->metaPhoneId)) {
            Log::warning('WhatsAppService: Meta not configured', ['to' => $to]);
            return new NotificationResult(false, null, 'WhatsApp Meta not configured');
        }

        $body = MessageTemplates::render($templateKey, $this->lang, $variables);

        try {
            $response = Http::withToken($this->metaToken)
                ->timeout(15)
                ->post("https://graph.facebook.com/{$this->metaVersion}/{$this->metaPhoneId}/messages", [
                    'messaging_product' => 'whatsapp',
                    'to'                => ltrim($to, '+'),
                    'type'              => 'text',
                    'text'              => ['body' => $body],
                ]);

            if ($response->failed()) {
                Log::error('whatsapp.meta.failed', [
                    'to'    => $to,
                    'error' => $response->json('error'),
                ]);
                return new NotificationResult(false, null, 'WhatsApp Meta error', $response->json() ?? []);
            }

            $data = $response->json();
            return new NotificationResult(true, $data['messages'][0]['id'] ?? null, 'WhatsApp envoyé', $data);

        } catch (\Throwable $e) {
            Log::error('whatsapp.meta.exception', ['error' => $e->getMessage()]);
            return new NotificationResult(false, null, $e->getMessage());
        }
    }

    private function sendViaTwilio(string $to, string $templateKey, array $variables): NotificationResult
    {
        if (empty($this->twilioSid)) {
            return new NotificationResult(false, null, 'Twilio WhatsApp not configured');
        }

        $body = MessageTemplates::render($templateKey, $this->lang, $variables);
        $waTo = str_starts_with($to, 'whatsapp:') ? $to : "whatsapp:{$to}";

        try {
            $response = Http::withBasicAuth($this->twilioSid, $this->twilioToken)
                ->asForm()
                ->timeout(15)
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$this->twilioSid}/Messages.json", [
                    'From' => $this->twilioFrom,
                    'To'   => $waTo,
                    'Body' => $body,
                ]);

            if ($response->failed()) {
                Log::error('whatsapp.twilio.failed', ['to' => $to, 'error' => $response->json('message')]);
                return new NotificationResult(false, null, 'WhatsApp Twilio error', $response->json() ?? []);
            }

            $data = $response->json();
            return new NotificationResult(true, $data['sid'], 'WhatsApp envoyé (Twilio)', $data);

        } catch (\Throwable $e) {
            Log::error('whatsapp.twilio.exception', ['error' => $e->getMessage()]);
            return new NotificationResult(false, null, $e->getMessage());
        }
    }
}
