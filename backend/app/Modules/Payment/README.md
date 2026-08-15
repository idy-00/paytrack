# Module de Paiement ATAABA

Module générique et réutilisable pour intégrer les paiements mobile money en Afrique de l'Ouest.

## Architecture

```
app/Modules/Payment/
├── Contracts/
│   ├── WalletInterface.php      # Interface pour les opérations wallet
│   ├── CashOutInterface.php     # Interface pour les retraits
│   └── CallbackInterface.php    # Interface pour les webhooks
├── Services/
│   ├── IntechCashOutService.php # Implémentation Intech API
│   └── WalletService.php        # Service wallet générique
├── Models/
│   ├── Wallet.php               # Copier depuis le projet hôte
│   ├── WalletTransaction.php
│   └── WithdrawalRequest.php
└── Http/
    └── Controllers/
        └── IntechWebhookController.php
```

## Installation sur un nouveau projet

1. Copier le dossier `app/Modules/Payment` dans votre projet Laravel
2. Ajouter les variables d'environnement (voir ci-dessous)
3. Exécuter les migrations
4. Configurer les routes webhook

## Variables d'environnement

```env
# API Intech (obligatoire)
INTECH_API_KEY=your_api_key
INTECH_API_SECRET=your_api_secret
INTECH_HMAC_SECRET=your_hmac_secret  # optionnel
INTECH_BASE_URL=https://api.intech.sn
INTECH_ENV=test  # ou prod

# Frais (configurable)
INTECH_FEE_WAVE=0.02       # 2%
INTECH_FEE_ORANGE=0.015    # 1.5%
INTECH_FEE_FREE=0.015      # 1.5%
INTECH_FEE_BANK=0.02       # 2% + 100 FCFA
```

## Règles de sécurité NON NÉGOCIABLES

1. **Vérification signature callback** : Toujours vérifier SHA256(`transactionId|externalTransactionId|appKey`) ou HMAC
2. **Idempotence** : Ne jamais traiter deux fois le même `externalTransactionId`
3. **Jamais de confiance frontend** : Les crédits/débits ne se font QUE via callback serveur-à-serveur
4. **Verrouillage DB** : Utiliser `lockForUpdate()` pour éviter les race conditions
5. **KYC obligatoire** : Pas de retrait sans vérification d'identité validée

## Utilisation

```php
use App\Modules\Payment\Services\WalletService;
use App\Modules\Payment\Services\IntechCashOutService;

// Créditer un wallet
$walletService = app(WalletService::class);
$walletService->credit($tenant->wallet, 50000, 'Paiement commande #123');

// Demander un retrait (CashOut)
$cashOut = app(IntechCashOutService::class);
$result = $cashOut->initiate(
    phone: '77 123 45 67',
    amount: 30000,
    provider: 'wave',
    externalId: 'WD-' . $withdrawalRequest->id
);

// Vérifier solde ATAABA avant CashOut
if (!$cashOut->hasEnoughBalance(30000)) {
    // Mettre en attente, alerter admin
}
```

## Modèle économique

- **Compte prépayé** : Le compte ATAABA est alimenté par virement bancaire à l'avance
- **Délais dépôt** : Avant 11h = dispo le jour même, après 11h = lendemain
- **Frais** : Wave 2%, Orange/Free 1.5%, Virement bancaire 2%+100 FCFA

## Migrations requises

```php
// wallets
Schema::create('wallets', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    $table->bigInteger('balance')->default(0);
    $table->bigInteger('pending_balance')->default(0);
    $table->bigInteger('total_credits')->default(0);
    $table->bigInteger('total_debits')->default(0);
    $table->timestamps();
});

// wallet_transactions
Schema::create('wallet_transactions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
    $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    $table->enum('type', ['credit', 'debit']);
    $table->bigInteger('amount');
    $table->bigInteger('balance_after');
    $table->string('description')->nullable();
    $table->string('paytech_transaction_id')->nullable();
    $table->nullableMorphs('transactionable');
    $table->timestamps();
});

// withdrawal_requests
Schema::create('withdrawal_requests', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
    $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
    $table->bigInteger('amount');
    $table->integer('fees')->default(0);
    $table->bigInteger('net_amount')->nullable();
    $table->string('payout_method'); // wave, orange_money, free_money, bank_transfer
    $table->string('payout_account');
    $table->enum('status', ['pending', 'processing', 'completed', 'rejected'])->default('pending');
    $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('processed_at')->nullable();
    $table->text('admin_notes')->nullable();
    $table->string('payout_reference')->nullable();
    $table->string('intech_external_id')->nullable()->unique();
    $table->string('intech_transaction_id')->nullable();
    $table->timestamps();
});
```

## Webhook URL

Configurer dans le dashboard Intech :
```
https://votre-domaine.com/api/webhooks/intech
```
