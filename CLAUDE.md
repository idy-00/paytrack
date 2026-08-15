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
HOST: 82.198.228.133
PORT: 65002
USER: u166382491
PASS: At@@b@Expertise2828
REMOTE: /home/u166382491/domains/lightsalmon-eel-638395.hostingersite.com/public_html/backend
```

---

# Module de Paiement Réutilisable

## Description

Module générique pour intégrer les paiements mobile money (Wave, Orange Money, Free Money) via l'API Intech GROUP. Ce module peut être réutilisé dans tout projet Laravel.

## Emplacement

`app/Modules/Payment/` contient :
- `Contracts/` : Interfaces (WalletInterface, CashOutInterface, CallbackVerifierInterface)
- `README.md` : Documentation complète

## Intégration dans un nouveau projet

### 1. Variables d'environnement

```env
INTECH_API_KEY=your_key
INTECH_API_SECRET=your_secret
INTECH_HMAC_SECRET=optional_hmac
INTECH_BASE_URL=https://api.intech.sn
INTECH_ENV=test
```

### 2. Configuration services.php

```php
'intech' => [
    'api_key'     => env('INTECH_API_KEY'),
    'api_secret'  => env('INTECH_API_SECRET'),
    'hmac_secret' => env('INTECH_HMAC_SECRET'),
    'base_url'    => env('INTECH_BASE_URL', 'https://api.intech.sn'),
    'env'         => env('INTECH_ENV', 'test'),
],
```

### 3. Service IntechService

Le service `App\Services\IntechService` fournit :

```php
// Vérifier si configuré
$intech->isConfigured(): bool

// Obtenir solde ATAABA
$intech->getBalance(): ?array

// Vérifier solde suffisant
$intech->hasEnoughBalance(int $amount): bool

// Initier un CashOut
$intech->cashOut(
    phone: '77 123 45 67',
    amount: 50000,
    provider: 'wave',  // wave, orange_money, free_money
    externalId: 'WD-123-abc'
): array

// Calculer les frais
$intech->calculateFees(50000, 'wave'): int  // retourne 1000 (2%)

// Vérifier signature callback
$intech->verifyCallbackSignature(array $payload, string $signature): bool
```

### 4. Webhook

Route : `POST /api/webhooks/intech`

Le webhook vérifie la signature SHA256 ou HMAC, puis :
- Si `SUCCESS/COMPLETED` : marque le retrait comme `completed`, débite le wallet
- Si `FAILED/REJECTED` : remet le retrait en `pending` pour traitement manuel

### 5. Modèle économique

- **Prépayé** : Le compte Intech ATAABA est alimenté par virement bancaire
- **Délais** : Dépôt avant 11h = dispo le jour même, après 11h = lendemain
- **Frais** :
  - Wave : 2%
  - Orange Money : 1.5%
  - Free Money : 1.5%
  - Virement bancaire : 2% + 100 FCFA

## Règles de sécurité (NON NÉGOCIABLES)

1. **Signature obligatoire** : `SHA256(transactionId|externalTransactionId|appKey)`
2. **Idempotence** : Utiliser `intech_external_id` unique
3. **Pas de confiance frontend** : Crédits/débits uniquement via callback serveur
4. **Verrouillage DB** : `lockForUpdate()` pour éviter les race conditions
5. **KYC obligatoire** : Vérifier `tenant->isKycApproved()` avant tout retrait

## Tables requises

- `wallets` : Solde par tenant
- `wallet_transactions` : Historique crédits/débits
- `withdrawal_requests` : Demandes de retrait avec statut
- `tenant_kyc_documents` : Documents KYC (identité + domicile)

## Flux retrait

1. Marchand demande retrait via `/api/wallet/withdraw`
2. Vérification KYC approuvé
3. Vérification solde suffisant (balance - pending)
4. Création `WithdrawalRequest` en `pending`
5. Admin ATAABA : soit CashOut automatique, soit traitement manuel
6. Si CashOut auto : appel API Intech, statut `processing`
7. Callback Intech → mise à jour statut + débit wallet

---

## État actuel (2026-08-15)

### Fonctionnel
- Backend API 100% avec wallet, retraits, KYC, Intech
- Frontend web avec WalletPage, KYC upload, admin ATAABA
- Mobile Flutter avec wallet, KYC

### En attente
- Clés API Intech (demander au dashboard développeur)
- Tests en production avec vraies transactions
