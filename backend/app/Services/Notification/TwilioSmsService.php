<?php

namespace App\Services\Notification;

use App\Services\Notification\Templates\MessageTemplates;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Twilio SMS service.
 *
 * Required .env:
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN=your_auth_token
 *   TWILIO_FROM_NUMBER=+12125551234       # Your Twilio number
 *   NOTIFICATION_LANG=fr                  # Default language (fr|en|wo)
 */
class TwilioSmsService implements NotificationServiceInterface
{
    private string $accountSid;
    private string $authToken;
    private string $fromNumber;
    private string $lang;

    public function __construct()
    {
        $this->accountSid = config('services.twilio.account_sid', '');
        $this->authToken  = config('services.twilio.auth_token', '');
        $this->fromNumber = config('services.twilio.from_number', '');
        $this->lang       = config('paytrack.notification_lang', 'fr');
    }

    public function send(string $to, string $template, array $variables = []): NotificationResult
    {
        if (empty($this->accountSid)) {
            Log::warning('TwilioSmsService: not configured, skipping SMS', ['to' => $to]);
            return new NotificationResult(false, null, 'Twilio not configured');
        }

        $body = MessageTemplates::render($template, $this->lang, $variables);

        try {
            $response = Http::withBasicAuth($this->accountSid, $this->authToken)
                ->asForm()
                ->timeout(15)
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$this->accountSid}/Messages.json", [
                    'From' => $this->fromNumber,
                    'To'   => $to,
                    'Body' => $body,
                ]);

            if ($response->failed()) {
                Log::error('twilio.sms.failed', [
                    'to'     => $to,
                    'status' => $response->status(),
                    'error'  => $response->json('message'),
                ]);
                return new NotificationResult(
                    false, null,
                    'Twilio error: ' . ($response->json('message') ?? $response->status()),
                    $response->json() ?? []
                );
            }

            $data = $response->json();
            Log::info('twilio.sms.sent', ['to' => $to, 'sid' => $data['sid']]);

            return new NotificationResult(true, $data['sid'], 'SMS envoyé', $data);

        } catch (\Throwable $e) {
            Log::error('twilio.sms.exception', ['error' => $e->getMessage()]);
            return new NotificationResult(false, null, $e->getMessage());
        }
    }

    public function sendBulk(array $recipients, string $template, array $variables = []): array
    {
        return array_map(
            fn($recipient) => $this->send($recipient, $template, $variables),
            $recipients
        );
    }
}
