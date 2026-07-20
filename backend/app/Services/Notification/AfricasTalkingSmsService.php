<?php

namespace App\Services\Notification;

use App\Services\Notification\Templates\MessageTemplates;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Africa's Talking SMS service.
 *
 * Docs: https://developers.africastalking.com/docs/sms/sending
 * Compte : africastalking.com → Dashboard → Settings → API Key
 *
 * Required .env:
 *   AFRICASTALKING_USERNAME=sandbox   (ou votre username production)
 *   AFRICASTALKING_API_KEY=           (voir Dashboard AT)
 *   AFRICASTALKING_FROM=PayTrack      (Sender ID approuvé — laisser vide pour sandbox)
 *
 * Note: En sandbox, utiliser username=sandbox et enregistrer le numéro de test
 *       dans l'interface sandbox AT avant d'envoyer.
 */
class AfricasTalkingSmsService implements NotificationServiceInterface
{
    private string $username;
    private string $apiKey;
    private ?string $from;
    private string $lang;

    public function __construct()
    {
        $this->username = config('services.africastalking.username', '');
        $this->apiKey   = config('services.africastalking.api_key', '');
        $this->from     = config('services.africastalking.from') ?: null;
        $this->lang     = config('paytrack.notification_lang', 'fr');
    }

    public function send(string $to, string $template, array $variables = []): NotificationResult
    {
        if (empty($this->username) || empty($this->apiKey)) {
            Log::warning('AfricasTalkingSmsService: not configured, skipping SMS', ['to' => $to]);
            return new NotificationResult(false, null, 'Africa\'s Talking not configured');
        }

        $body = MessageTemplates::render($template, $this->lang, $variables);

        // Format numéro E.164 (+221XXXXXXXXX)
        $phone = $this->formatPhone($to);

        try {
            $params = [
                'username' => $this->username,
                'to'       => $phone,
                'message'  => $body,
            ];

            if ($this->from) {
                $params['from'] = $this->from;
            }

            $baseUrl = $this->username === 'sandbox'
                ? 'https://api.sandbox.africastalking.com/version1/messaging'
                : 'https://api.africastalking.com/version1/messaging';

            $response = Http::withHeaders([
                'apiKey' => $this->apiKey,
                'Accept' => 'application/json',
            ])
            ->asForm()
            ->timeout(15)
            ->post($baseUrl, $params);

            if ($response->failed()) {
                Log::error('africastalking.sms.failed', [
                    'to'     => $phone,
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return new NotificationResult(
                    false, null,
                    'Africa\'s Talking error: ' . $response->status(),
                    $response->json() ?? []
                );
            }

            $data = $response->json();
            $msgId = $data['SMSMessageData']['Recipients'][0]['messageId'] ?? null;

            Log::info('africastalking.sms.sent', ['to' => $phone, 'messageId' => $msgId]);
            return new NotificationResult(true, $msgId, 'SMS envoyé via Africa\'s Talking', $data);

        } catch (\Throwable $e) {
            Log::error('africastalking.sms.exception', ['error' => $e->getMessage()]);
            return new NotificationResult(false, null, $e->getMessage());
        }
    }

    public function sendBulk(array $recipients, string $template, array $variables = []): array
    {
        return array_map(
            fn($r) => $this->send($r, $template, $variables),
            $recipients
        );
    }

    private function formatPhone(string $phone): string
    {
        // Nettoyer et s'assurer du format E.164
        $clean = preg_replace('/[\s\-\(\)]/', '', $phone);
        if (!str_starts_with($clean, '+')) {
            // Supposer Sénégal si pas de préfixe international
            $clean = '+221' . ltrim($clean, '0');
        }
        return $clean;
    }
}
