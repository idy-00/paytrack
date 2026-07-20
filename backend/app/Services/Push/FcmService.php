<?php

namespace App\Services\Push;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Firebase Cloud Messaging (FCM) push notification service.
 * Targets the Flutter mobile app (Android priority for V1).
 *
 * Uses FCM HTTP v1 API with OAuth2 service account authentication.
 *
 * Required .env:
 *   FCM_PROJECT_ID=your-firebase-project-id
 *   FCM_SERVICE_ACCOUNT_JSON=/path/to/firebase-service-account.json
 *     OR (alternative — paste JSON content as env var):
 *   FCM_SERVICE_ACCOUNT_CREDENTIALS={"type":"service_account",...}
 *
 * The service account JSON is downloaded from:
 *   Firebase Console → Project Settings → Service accounts → Generate new private key
 */
class FcmService
{
    private string $projectId;
    private ?array $credentials;

    public function __construct()
    {
        $this->projectId  = config('services.fcm.project_id', '');
        $this->credentials = $this->loadCredentials();
    }

    /**
     * Send a push notification to a single device token.
     */
    public function sendToToken(string $fcmToken, string $title, string $body, array $data = []): FcmResult
    {
        return $this->send([
            'token' => $fcmToken,
            'notification' => ['title' => $title, 'body' => $body],
            'data'  => array_map('strval', $data),
            'android' => [
                'priority' => 'high',
                'notification' => [
                    'channel_id' => 'paytrack_payments',
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ],
            ],
        ]);
    }

    /**
     * Send to a topic (e.g. "tenant_123_overdue").
     */
    public function sendToTopic(string $topic, string $title, string $body, array $data = []): FcmResult
    {
        return $this->send([
            'topic' => $topic,
            'notification' => ['title' => $title, 'body' => $body],
            'data'  => array_map('strval', $data),
            'android' => ['priority' => 'high'],
        ]);
    }

    /**
     * Send to multiple tokens (max 500 per batch per FCM limits).
     */
    public function sendMulticast(array $tokens, string $title, string $body, array $data = []): array
    {
        // FCM v1 doesn't support multicast directly — batch individual sends
        return array_map(
            fn($token) => $this->sendToToken($token, $title, $body, $data),
            array_slice($tokens, 0, 500)
        );
    }

    private function send(array $message): FcmResult
    {
        if (empty($this->projectId) || ! $this->credentials) {
            Log::warning('FcmService: not configured, skipping push');
            return new FcmResult(false, null, 'FCM not configured');
        }

        try {
            $token = $this->getAccessToken();

            $response = Http::withToken($token)
                ->timeout(10)
                ->post(
                    "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send",
                    ['message' => $message]
                );

            if ($response->failed()) {
                Log::error('fcm.send.failed', [
                    'status' => $response->status(),
                    'error'  => $response->json('error'),
                ]);
                return new FcmResult(false, null, 'FCM error: ' . ($response->json('error.message') ?? $response->status()));
            }

            $data = $response->json();
            return new FcmResult(true, $data['name'] ?? null, 'Push envoyé', $data);

        } catch (\Throwable $e) {
            Log::error('fcm.send.exception', ['error' => $e->getMessage()]);
            return new FcmResult(false, null, $e->getMessage());
        }
    }

    /**
     * Get OAuth2 access token using service account credentials.
     * Cached for 55 minutes (token TTL is 60 min).
     */
    private function getAccessToken(): string
    {
        return \Illuminate\Support\Facades\Cache::remember('fcm_access_token', 3300, function () {
            $jwt = $this->buildJwt();

            $response = Http::asForm()
                ->timeout(10)
                ->post('https://oauth2.googleapis.com/token', [
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion'  => $jwt,
                ]);

            if ($response->failed()) {
                throw new \RuntimeException('FCM OAuth failed: ' . $response->status());
            }

            return $response->json('access_token');
        });
    }

    private function buildJwt(): string
    {
        $now = time();
        $header  = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'iss'   => $this->credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'iat'   => $now,
            'exp'   => $now + 3600,
        ]));

        $signingInput = "{$header}.{$payload}";
        $privateKey   = openssl_pkey_get_private($this->credentials['private_key']);

        openssl_sign($signingInput, $signature, $privateKey, OPENSSL_ALGO_SHA256);

        return $signingInput . '.' . base64_encode($signature);
    }

    private function loadCredentials(): ?array
    {
        // Option 1: path to JSON file
        $path = config('services.fcm.service_account_json');
        if ($path && file_exists($path)) {
            return json_decode(file_get_contents($path), true);
        }

        // Option 2: JSON content in env variable
        $raw = config('services.fcm.service_account_credentials');
        if ($raw) {
            return json_decode($raw, true);
        }

        return null;
    }
}
