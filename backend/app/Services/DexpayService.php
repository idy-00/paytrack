<?php

namespace App\Services;

use App\Models\DexpayWebhook;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;

class DexpayService
{
    private string $publicKey;
    private string $secretKey;
    private string $baseUrl;

    public function __construct()
    {
        $this->publicKey = config('services.dexpay.public_key', '');
        $this->secretKey = config('services.dexpay.secret_key', '');
        $this->baseUrl = config('services.dexpay.base_url', 'https://api.dexpay.africa/api/v1');
    }

    public function isConfigured(): bool
    {
        return !empty($this->publicKey) && !empty($this->secretKey);
    }

    /**
     * Créer une checkout session
     *
     * Champs requis par l'API DexPay:
     * - reference (string)
     * - item_name (string)
     * - amount (number >= 1)
     * - currency (XOF, XAF, GNF, USD, EUR)
     * - success_url (URL)
     * - failure_url (URL)
     * - webhook_url (URL, optional)
     */
    public function createCheckoutSession(array $data): array
    {
        if (!$this->isConfigured()) {
            throw new \Exception('DexPay not configured');
        }

        $payload = [
            'reference' => $data['reference'],
            'item_name' => $data['item_name'] ?? $data['description'] ?? 'Paiement PayTrack',
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'XOF',
            'success_url' => $data['success_url'] ?? config('app.frontend_url') . '/payment/success',
            'failure_url' => $data['failure_url'] ?? $data['cancel_url'] ?? config('app.frontend_url') . '/payment/cancel',
            'webhook_url' => $data['webhook_url'] ?? route('webhooks.dexpay'),
            // Le client final règle strictement le prix de la commande : les
            // frais de transaction restent à la charge du marchand.
            'client_support_fee' => false,
        ];

        // Champs optionnels
        if (!empty($data['customer'])) {
            $payload['customer'] = $data['customer'];
        }
        if (!empty($data['metadata'])) {
            $payload['metadata'] = $data['metadata'];
        }

        $response = Http::withHeaders([
            'x-api-key' => $this->publicKey,
            'Content-Type' => 'application/json',
        ])->post("{$this->baseUrl}/checkout-sessions", $payload);

        if (!$response->successful()) {
            Log::error('DexPay checkout session creation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'payload' => $payload,
            ]);
            throw new \Exception('Échec création session DexPay: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Récupérer une checkout session par référence
     */
    public function getCheckoutSession(string $reference): ?array
    {
        if (!$this->isConfigured()) return null;

        $response = Http::withHeaders([
            'x-api-key' => $this->publicKey,
        ])->get("{$this->baseUrl}/checkout-sessions/{$reference}");

        if (!$response->successful()) {
            Log::warning('DexPay get session failed', [
                'reference' => $reference,
                'status' => $response->status(),
            ]);
            return null;
        }

        return $response->json();
    }

    /**
     * Lister les checkout sessions
     */
    public function listCheckoutSessions(array $params = []): ?array
    {
        if (!$this->isConfigured()) return null;

        $response = Http::withHeaders([
            'x-api-key' => $this->publicKey,
        ])->get("{$this->baseUrl}/checkout-sessions", $params);

        if (!$response->successful()) {
            return null;
        }

        return $response->json();
    }

    /**
     * Vérifier la signature du webhook
     */
    public function verifyWebhookSignature(string $rawBody, string $signature): bool
    {
        if ($signature === '') {
            return false;
        }

        // DexPay signe le corps HTTP brut. Ne jamais décoder/ré-encoder le JSON
        // avant ce calcul : l'ordre des champs et les espaces font partie du HMAC.
        $computed = hash_hmac('sha256', $rawBody, $this->secretKey);
        return hash_equals($computed, $signature);
    }

    /**
     * Vérifier si une transaction a déjà été traitée (idempotence)
     */
    public function isTransactionProcessed(string $transactionId): bool
    {
        return DexpayWebhook::where('transaction_id', $transactionId)
            ->where('processing_status', 'processed')
            ->exists();
    }

    /**
     * Logger un webhook reçu
     */
    public function logWebhook(array $payload, string $rawBody, string $signature, string $ip): DexpayWebhook
    {
        // DexPay emits checkout webhook fields at the root.  Keep support for
        // the historical envelope used by early integrations as well.
        $data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
        $transactionId = $data['transaction_id'] ?? $data['checkout_session_id'] ?? null;
        $isValid = $this->verifyWebhookSignature($rawBody, $signature);

        $attributes = [
            'transaction_id' => $transactionId,
            'checkout_session_id' => $data['checkout_session_id'] ?? null,
            'reference' => $data['reference'] ?? null,
            'event_type' => $payload['event'] ?? 'unknown',
            'payload' => $payload,
            'signature_received' => $signature,
            'signature_valid' => $isValid,
            'ip_address' => $ip,
            'processing_status' => $isValid ? 'received' : 'failed',
            'processing_notes' => $isValid ? null : 'Invalid signature',
        ];
        try {
            return DexpayWebhook::create($attributes);
        } catch (QueryException $exception) {
            if ($transactionId && in_array($exception->getCode(), ['23000', '23505'], true)) {
                return DexpayWebhook::where('transaction_id', $transactionId)->firstOrFail();
            }
            throw $exception;
        }
    }

    /**
     * Extraire les informations de paiement du payload webhook
     */
    public function extractPaymentInfo(array $payload): array
    {
        // DexPay's documented checkout payload is flat; do not silently lose
        // the transaction reference when no `data` envelope is present.
        $data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;

        return [
            'event' => $payload['event'] ?? null,
            'transaction_id' => $data['transaction_id'] ?? null,
            'checkout_session_id' => $data['checkout_session_id'] ?? null,
            'reference' => $data['reference'] ?? null,
            'amount' => $data['amount'] ?? 0,
            'currency' => $data['currency'] ?? 'XOF',
            'status' => $data['status'] ?? null,
            'operator' => $data['operator'] ?? null,
            'external_transaction_id' => $data['external_transaction_id'] ?? null,
            // L'absence de ces valeurs ne vaut jamais zéro : le webhook doit
            // alors être rejoué plutôt que créditer le marchand au brut.
            'fee_amount' => $data['fee_amount'] ?? null,
            'merchant_net' => $data['merchant_net'] ?? null,
            'customer' => $data['customer'] ?? [],
            'failure_reason' => $data['failure_reason'] ?? null,
            'completed_at' => $data['completed_at'] ?? null,
            'failed_at' => $data['failed_at'] ?? null,
        ];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAYOUT (CashOut) - Retraits vers mobile money
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Providers de payout disponibles sur le compte ATAABA
     * Format: provider_id => [name, country]. Les frais ne sont jamais
     * dupliqués ici : DexPay les publie dynamiquement par provider.
     */
    public const PAYOUT_PROVIDERS = [
        // Sénégal
        'wave_sn_payout' => ['name' => 'Wave Sénégal', 'country' => 'SN'],
        'om_sn_payout' => ['name' => 'Orange Money Sénégal', 'country' => 'SN'],
        'mixx_sn_payout' => ['name' => 'Mixx By Yas Sénégal', 'country' => 'SN'],
        // Côte d'Ivoire
        'mtn_ci_payout' => ['name' => 'MTN Côte d\'Ivoire', 'country' => 'CI'],
        'om_ci_payout' => ['name' => 'Orange Money CI', 'country' => 'CI'],
        'moov_ci_payout' => ['name' => 'Moov CI', 'country' => 'CI'],
        // Cameroun
        'mtn_cm_payout' => ['name' => 'MTN Cameroun', 'country' => 'CM'],
        'om_cm_payout' => ['name' => 'Orange Money CM', 'country' => 'CM'],
        // Guinée
        'om_gn_payout' => ['name' => 'Orange Money Guinée', 'country' => 'GN'],
    ];

    /**
     * Créer un payout (retrait vers mobile money)
     *
     * @param string $phone Numéro du bénéficiaire (+221XXXXXXXXX)
     * @param int $amount Montant en FCFA
     * @param string $provider Provider ID (wave_sn_payout, om_sn_payout, etc.)
     * @param string $recipientName Nom du bénéficiaire
     * @param string|null $reference Référence interne (générée si null)
     * @return array Réponse API DexPay
     * @throws \Exception
     */
    public function createPayout(
        string $phone,
        int $amount,
        string $provider,
        string $recipientName,
        ?string $reference = null
    ): array {
        if (!$this->isConfigured()) {
            throw new \Exception('DexPay not configured');
        }

        $providerInfo = $this->findPayoutProvider($provider);
        $reference = $reference ?? 'WD-' . time() . '-' . substr(md5($phone), 0, 6);

        $payload = [
            'amount' => $amount,
            'currency' => 'XOF',
            'destination_phone' => $phone,
            'destination_details' => [
                'operator' => $provider,
                'countryISO' => $providerInfo['provider_country'],
                'name' => $recipientName,
            ],
            'reference' => $reference,
        ];

        Log::info('DexPay payout initiated', [
            'provider' => $provider,
            'amount' => $amount,
            'phone' => substr($phone, 0, -4) . '****',
            'reference' => $reference,
        ]);

        $response = Http::withHeaders([
            'x-api-key' => $this->publicKey,
            'x-api-secret' => $this->secretKey,
            'Content-Type' => 'application/json',
        ])->post("{$this->baseUrl}/payouts", $payload);

        $body = $response->json();

        if (!$response->successful()) {
            Log::error('DexPay payout failed', [
                'status' => $response->status(),
                'body' => $body,
                'reference' => $reference,
            ]);

            // Erreur de solde insuffisant
            if ($response->status() === 409 && str_contains($body['message'] ?? '', 'Insufficient balance')) {
                throw new \Exception('Solde ATAABA insuffisant pour ce retrait. Montant demandé: ' . $amount . ' XOF');
            }

            throw new \Exception($body['message'] ?? 'Échec du payout DexPay');
        }

        Log::info('DexPay payout created', [
            'reference' => $reference,
            'payout_id' => $body['data']['id'] ?? null,
        ]);

        return $body;
    }

    /**
     * Lister les payouts
     */
    public function listPayouts(array $params = []): ?array
    {
        if (!$this->isConfigured()) return null;

        $response = Http::withHeaders([
            'x-api-secret' => $this->secretKey,
        ])->get("{$this->baseUrl}/payouts", $params);

        return $response->successful() ? $response->json() : null;
    }

    /**
     * Récupérer un payout par ID ou référence
     */
    public function getPayout(string $id): ?array
    {
        if (!$this->isConfigured()) return null;

        $response = Http::withHeaders([
            'x-api-secret' => $this->secretKey,
        ])->get("{$this->baseUrl}/payouts/{$id}");

        return $response->successful() ? $response->json() : null;
    }

    /**
     * Devis de retrait basé sur le tarif actuellement publié par DexPay.
     * Le montant final reste celui retourné par la création du payout.
     */
    public function quotePayout(int $grossAmount, string $provider): array
    {
        $providerInfo = $this->findPayoutProvider($provider);
        $fee = (float) ($providerInfo['provider_fee'] ?? 0);
        $feeType = $providerInfo['provider_fee_type'] ?? null;

        if ($fee < 0 || !in_array($feeType, ['percentage', 'fixed'], true)) {
            throw new \RuntimeException('Tarification DexPay indisponible pour ce moyen de retrait.');
        }

        $estimatedFees = $feeType === 'percentage'
            ? (int) ceil($grossAmount * $fee / 100)
            : (int) ceil($fee);

        return [
            'gross_amount' => $grossAmount,
            'estimated_fee' => $estimatedFees,
            'estimated_net_amount' => max(0, $grossAmount - $estimatedFees),
            'provider' => $providerInfo['provider_short_name'],
            'fee_source' => 'dexpay_provider_api',
        ];
    }

    /** @return array<string, mixed> */
    public function getPayoutProviders(?string $country = null): array
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('DexPay API non configurée.');
        }

        $params = ['filters[provider_status]' => 'active'];
        if ($country) {
            $params['filters[provider_country]'] = $country;
        }
        $response = Http::withHeaders([
            'x-api-key' => $this->publicKey,
            'x-api-secret' => $this->secretKey,
        ])->get("{$this->baseUrl}/payouts-providers", $params);

        if (!$response->successful()) {
            throw new \RuntimeException('Impossible de récupérer les tarifs DexPay actuels.');
        }

        return $response->json('data', []);
    }

    /** @return array<string, mixed> */
    private function findPayoutProvider(string $provider): array
    {
        foreach ($this->getPayoutProviders() as $providerInfo) {
            if (($providerInfo['provider_short_name'] ?? null) === $provider) {
                return $providerInfo;
            }
        }

        throw new \InvalidArgumentException("Provider de payout DexPay indisponible : {$provider}.");
    }
}
