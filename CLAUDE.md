# PayTrack - Instructions Claude Code

## Projet

PayTrack est une plateforme SaaS de gestion des ventes à crédit pour marchands au Sénégal. Backend Laravel + Frontend React + Mobile Flutter.

## Architecture

```
paytrack/
├── backend/          # Laravel 11 API
├── frontend/         # React + Vite + Tailwind
├── mobile/           # Flutter + Riverpod
└── docs/             # Documentation
```

## Commandes fréquentes

```bash
# Backend
cd paytrack/backend && php artisan serve
php artisan migrate
php artisan test

# Frontend
cd paytrack/frontend && npm run dev
npm run build

# Mobile
cd paytrack/mobile && flutter run
```

## Déploiement Hostinger

```
Les paramètres d’accès sont fournis uniquement via les variables
`HOSTINGER_SSH_HOST`, `HOSTINGER_SSH_PORT`, `HOSTINGER_SSH_USER`,
`HOSTINGER_SSH_PASS` et `HOSTINGER_REMOTE_PATH`. Ne jamais les versionner.
```

---

# Module de Paiement DexPay

## Description

Module générique pour intégrer les paiements mobile money (Wave, Orange Money, MTN, Moov) via l'API DexPay. Ce module gère à la fois le Cash In (encaissement) et le Cash Out (payout).

## Emplacement

`app/Services/DexpayService.php` — Service unique pour tous les paiements

## Intégration dans un nouveau projet

### 1. Variables d'environnement

```env
DEXPAY_PUBLIC_KEY=pk_live_xxxxx
DEXPAY_SECRET_KEY=sk_live_xxxxx
DEXPAY_BASE_URL=https://api.dexpay.africa/api/v1
DEXPAY_ENV=live
```

### 2. Configuration services.php

```php
'dexpay' => [
    'public_key' => env('DEXPAY_PUBLIC_KEY'),
    'secret_key' => env('DEXPAY_SECRET_KEY'),
    'base_url'   => env('DEXPAY_BASE_URL', 'https://api.dexpay.africa/api/v1'),
    'env'        => env('DEXPAY_ENV', 'live'),
],
```

### 3. Service DexpayService

Le service `App\Services\DexpayService` fournit :

```php
// Vérifier si configuré
$dexpay->isConfigured(): bool

// === CASH IN (Encaissement) ===

// Créer une checkout session
$dexpay->createCheckoutSession([
    'reference' => 'ORD-123',
    'item_name' => 'Commande #123',
    'amount' => 5000,
    'currency' => 'XOF',
    'success_url' => 'https://...',
    'failure_url' => 'https://...',
    'webhook_url' => 'https://...',
]): array

// === CASH OUT (Payout) ===

// Créer un payout
$dexpay->createPayout(
    phone: '+221781194805',
    amount: 10000,
    provider: 'wave_sn_payout',  // wave_sn_payout, om_sn_payout, etc.
    recipientName: 'John Doe',
    reference: 'WD-123'
): array

// Calculer les frais de payout
$dexpay->calculatePayoutFees(10000, 'wave_sn_payout'): int  // retourne 150 (1.5%)

// Liste des providers disponibles
$dexpay->getPayoutProviders('SN'): array  // ['wave_sn_payout' => [...], 'om_sn_payout' => [...]]

// === WEBHOOK ===

// Vérifier signature webhook
$dexpay->verifyWebhookSignature(array $payload, string $signature): bool
```

### 4. Providers de payout

| Provider ID | Nom | Pays | Frais |
|-------------|-----|------|-------|
| `wave_sn_payout` | Wave Sénégal | SN | 1.5% |
| `om_sn_payout` | Orange Money Sénégal | SN | 1.4% |
| `mixx_sn_payout` | Mixx By Yas Sénégal | SN | 1.5% |
| `mtn_ci_payout` | MTN Côte d'Ivoire | CI | 1.5% |
| `om_ci_payout` | Orange Money CI | CI | 2.0% |
| `moov_ci_payout` | Moov CI | CI | 2.0% |

### 5. Webhook

Route : `POST /api/webhooks/dexpay`

Le webhook vérifie la signature HMAC-SHA256 (header `x-dexchange-signature`), puis traite les événements :
- `checkout.completed` : Paiement réussi
- `checkout.failed` : Paiement échoué
- `checkout.refunded` : Remboursement

### 6. Modèle économique

- **Prépayé** : Le compte DexPay ATAABA doit être alimenté (Wave, virement)
- **Pas d'endpoint /balance** : Vérifier le solde via dashboard DexPay
- **Frais** : Variables selon provider (1.4% à 2%)

## Règles de sécurité (NON NÉGOCIABLES)

1. **Signature webhook** : HMAC-SHA256 avec secret key
2. **Idempotence** : `dexpay_webhooks` table avec `transaction_id` unique
3. **Pas de confiance frontend** : Crédits/débits uniquement via webhook serveur
4. **Verrouillage DB** : `lockForUpdate()` pour éviter les race conditions
5. **KYC obligatoire** : Vérifier `tenant->isKycApproved()` avant tout retrait

## Tables requises

- `wallets` : Solde par tenant
- `wallet_transactions` : Historique crédits/débits
- `withdrawal_requests` : Demandes de retrait avec statut
- `dexpay_webhooks` : Logs des webhooks reçus (idempotence)
- `tenant_kyc_documents` : Documents KYC (identité + domicile)

## Flux retrait

1. Marchand demande retrait via `/api/wallet/withdraw`
2. Vérification KYC approuvé
3. Vérification solde suffisant (balance - pending)
4. Création `WithdrawalRequest` en `pending`
5. Admin ATAABA : CashOut automatique via DexPay
6. Appel API DexPay `/payouts`, statut `processing`
7. Payout instantané (Wave/OM), statut `completed`

---

## État actuel (2026-08-29)

### Fonctionnel ✓
- Backend API 100% avec wallet, retraits, KYC
- DexPay Cash In (checkout sessions Wave, Orange Money, MTN, Moov)
- DexPay Cash Out (payouts Wave, Orange Money) — **TESTÉ EN PRODUCTION**
- Frontend web avec WalletPage, KYC upload, admin ATAABA
- Mobile Flutter avec wallet, KYC

### Tests réels effectués (2026-08-29)
- Payout Wave 100 XOF → SUCCÈS (TX: TIDXVII2D0112F)
- Payout Orange Money 100 XOF → SUCCÈS (TX: TIDMI9IC176WJ)
- Frais vérifiés : 2 XOF pour 100 XOF (1.5% Wave, 1.4% OM)

### À déployer
- Migration `dexpay_webhooks` sur Hostinger
- Configurer webhook URL dans dashboard DexPay
