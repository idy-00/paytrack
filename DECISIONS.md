# PayTrack — Decisions Log

## 2026-07-29 — Feature Verification

### Bugs Verified as Already Working

#### Bug 1: Nouveau client in sale flow
**Status:** Already working
**Test:** Created client "Test Client Bug" via modal during new sale → appeared in client list + sale linked correctly.
**Files:** `NouvelleVentePage.jsx` (L136-161), `clientStore.js`

#### Bug 2: Client sidebar + route protection  
**Status:** Already working
**Test:** Logged in as client (aminata@gmail.com) → sidebar shows only "Mon dossier", "Mes paiements", "Déconnexion". Attempted URL manipulation to /clients, /ventes, /paiements, /qr-scan → all redirected to /client/dashboard.
**Files:** `AppLayout.jsx` (CLIENT_NAV L16-19), `ProtectedRoute.jsx`, `App.jsx` (route roles)

### Features Verified as Already Implemented

#### 1. Vente comptant
**Status:** Fully implemented
**Test:** Created vente comptant for Aminata Ndiaye, Samsung Galaxy S24 Ultra → VT-2026-1785 shows:
- Type: "Comptant"
- Progress: 100%
- Status: Soldé
- "Payé intégralement" display
**Files:** `NouvelleVentePage.jsx` (PAYMENT_MODES L32-35, isComptant logic)

#### 2. Fréquence personnalisable
**Status:** Fully implemented
**Options available:** Hebdomadaire, Mensuel, Toutes les 2 semaines, Trimestriel, Personnalisé (tous les X jours)
**Files:** `NouvelleVentePage.jsx` (FREQUENCIES L24-30, custom_days field)

#### 3. Gestion de stock
**Status:** Fully implemented
**Features:**
- Stock quantities displayed in article selection
- Low stock warnings (≤ 3)
- Out of stock blocking
- Stock page with add/remove actions
- Stats cards (articles en stock, stock bas, ruptures)
**Files:** `stockStore.js`, `StockPage.jsx`, `NouvelleVentePage.jsx`

#### 4. No commission architecture
**Status:** Confirmed clean
**Verification:** Grep for "commission|fee|frais" in backend returned no business logic matches.
**Design:** PayTrack is subscription-only platform. Client pays vendor directly via Wave/Orange Money. No payment routing or transaction fees.

#### 5. Abonnement trimestriel/semestriel
**Status:** Implemented in landing page
**Plans:**
- Démarrage: Gratuit (pour toujours)
- Professionnel: 25 000 FCFA / trimestre / boutique
- Entreprise: 45 000 FCFA / semestre / multi-boutiques
**Files:** `LandingPage.jsx` (plans L143-159)

### Logo
**Status:** Already integrated
**Location:** `frontend/public/logo.jpeg` (same as `paytrack/logo.jpeg`)
**Colors:** Blue (#1D6FE8) + Green accents — matches app palette
**Usage:** Sidebar, landing page navbar, footer

---

## Architecture Notes

### Multi-tenant isolation
- Backend: `BelongsToTenant` trait, `EnsureTenantAccess` middleware
- Frontend: Mock data for demo, real isolation via API in production

### State management
- Zustand stores with persist middleware
- Stores: authStore, clientStore, saleStore, stockStore

### Payment modes
- `tranche`: Échéancier with acompte + installments
- `comptant`: Single full payment, no schedule

---

## 2026-08-08 — Ajout Abonnements, PayTech, Commandes & Stock

### Modèle d'abonnement implémenté

| Pack | Mensuel | Annuel | Produits | Users | Features |
|------|---------|--------|----------|-------|----------|
| Essentiel | 3 000 FCFA | 30 000 FCFA | 50 | 1 | Basique |
| Pro | 7 500 FCFA | 75 000 FCFA | 500 | 3 | +Inventaire, livraisons, créances |
| Business | 13 000 FCFA | 130 000 FCFA | Illimité | 5 | +Fournisseurs, multi-boutique |

**Fonctionnement :**
- Auto-inscription avec essai gratuit 14 jours
- Paiement via PayTech (Wave, Orange Money, carte, etc.)
- Activation automatique après paiement confirmé
- Suspension automatique si non-renouvellement
- Configuration assistée optionnelle à 10 000 FCFA (flag dans admin)

### Modèle portefeuille (wallet)

**Flux argent :**
1. Client final paie une commande via PayTech → argent arrive sur compte ATAABA
2. PayTrack crédite le portefeuille virtuel du marchand
3. Marchand demande retrait → ATAABA vire vers Wave/Orange Money du marchand
4. Même mécanisme pour paiement des abonnements

**Tables créées :** `wallets`, `wallet_transactions`, `withdrawal_requests`

### Sécurité webhooks PayTech

Implémenté selon norme industrie :
- Vérification signature HMAC sur chaque callback
- Idempotence (ignore doublons par transaction_id)
- Double-vérification via API PayTech avant crédit
- Journalisation complète (`paytech_webhooks` table)
- HTTPS obligatoire
- Ne jamais faire confiance au frontend seul

### Module Commandes

**Commandes clients (`orders`) :**
- Statuts : pending → confirmed → preparing → ready → delivered / cancelled
- Paiement comptant ou par tranche
- Réservation stock à la confirmation, sortie à la livraison
- QR code unique par commande
- Paiement en ligne via PayTech

**Commandes fournisseurs (`supplier_orders`) — Plan Business uniquement :**
- Création bon de commande
- Réception partielle/totale
- Suivi dettes fournisseurs
- Entrée stock automatique à la réception

### Stock avancé

**Nouvelles colonnes `articles` :**
- `stock_reserved` : quantité réservée (commandes confirmées non livrées)
- `stock_alert_threshold` : seuil alerte stock bas
- `track_stock` : flag pour désactiver suivi (services)

**Stock disponible = stock - stock_reserved**

**Mouvements tracés (`stock_movements`) :**
- Types : in, out, adjustment, reservation, release
- Raisons : supplier_receipt, sale, order, adjustment, inventory, return
- Historique complet avec before/after

**Inventaires (`inventories`) — Plan Pro/Business :**
- Comptage manuel vs stock système
- Ajustement automatique à la validation

### Limitation par plan

Appliqué au niveau middleware, pas seulement UI :
- `CheckSubscription` : vérifie statut trial/active
- `CheckPlanFeature` : vérifie feature (supplier_orders, advanced_stock, multi_shop)
- Tenant methods : `canAddProduct()`, `canAddUser()`, `canUseSupplierOrders()`, etc.

### Dashboard ATAABA (super admin)

Endpoints `/api/ataaba-admin/*` pour :
- Suivi inscriptions, abonnements, paiements
- Gestion demandes de retrait
- Modification limites compte par tenant
- Demandes configuration assistée

### Fichiers créés/modifiés

**Backend :**
- 17 nouvelles tables (migration SQL exécutée)
- 15 nouveaux models
- 8 nouveaux controllers
- 3 nouveaux services (PaytechService, SubscriptionService, StockService)
- 2 nouveaux middlewares (CheckSubscription, CheckPlanFeature)
- 3 nouvelles policies
- Routes API étendues

**Frontend :**
- API client étendu avec tous les nouveaux endpoints
- 10 nouvelles pages (SubscriptionPage, WalletPage, OrdersPage, NewOrderPage, OrderDetailPage, InventoriesPage, SuppliersPage, SupplierOrdersPage, AtaabaAdminPage)
- Routes protégées par rôle + plan

---

## 2026-08-15 — Intégration Intech API CashOut + KYC

### API Intech CashOut intégrée

**Nouveau service** : `IntechService.php`
- `isConfigured()` : vérifie présence clés API
- `getBalance()` : récupère solde compte ATAABA
- `hasEnoughBalance(amount)` : vérifie avant CashOut
- `cashOut(phone, amount, provider, externalId)` : initie un transfert
- `verifyCallbackSignature(payload, signature)` : vérifie SHA256/HMAC
- `calculateFees(amount, provider)` : calcule les frais (Wave 2%, Orange/Free 1.5%)

**Config** : `services.php` + `.env.example` avec variables `INTECH_*`

### Webhook Intech

- Route : `POST /api/webhooks/intech`
- Controller : `IntechWebhookController.php`
- Vérification signature SHA256 ou HMAC
- Idempotence via `intech_external_id`
- Sur SUCCESS : marque retrait `completed`, débite wallet
- Sur FAILED : remet en `pending` pour traitement manuel

### KYC marchand obligatoire

**Migration** : `2026_08_15_000001_add_intech_and_kyc_fields.php`
- Table `tenant_kyc_documents` (identity, address_proof)
- Colonnes `kyc_status`, `kyc_approved_at` sur `tenants`
- Colonnes `intech_*`, `fees`, `net_amount` sur `withdrawal_requests`

**Modèle** : `TenantKycDocument.php`
- Upload pièce d'identité + justificatif domicile
- Statuts : pending → approved/rejected

**API** :
- `GET /api/kyc/status` : statut KYC marchand
- `POST /api/kyc/upload` : upload document
- `GET /api/ataaba-admin/kyc-documents` : liste admin
- `POST /api/ataaba-admin/kyc-documents/{id}/review` : valider/rejeter

### Flux retrait amélioré

1. Marchand ne peut pas retirer si KYC non approuvé
2. Admin ATAABA peut :
   - CashOut automatique via Intech (si API configurée + KYC OK + solde ATAABA OK)
   - Traitement manuel en fallback
   - Rejet avec motif

### Écrans web

- `WalletPage.jsx` : badge KYC, modal upload documents, blocage retrait si KYC non validé
- `AtaabaAdminPage.jsx` : onglet KYC, solde Intech, bouton CashOut auto

### Écrans mobile Flutter

- `wallet_screen.dart` : KYC status, upload documents, validation avant retrait
- `api_service.dart` : endpoints `getKycStatus()`, `uploadKycDocument()`

### Module réutilisable

- `app/Modules/Payment/` avec interfaces et README
- `CLAUDE.md` à la racine pour documentation future

---

## 2026-08-09 — Vérification complète

### Backend vérifié fonctionnel
- `php artisan route:list` : 70+ routes API compilent sans erreur
- PaytechWebhookController : HMAC signature, idempotence, double-vérification API
- CheckSubscription + CheckPlanFeature middleware : enforcement au niveau route
- Tenant.php : canAddProduct(), canAddUser(), canUseSupplierOrders(), canUseAdvancedStock(), canUseMultiShop()
- Subscription.php : canAccess(), daysUntilExpiry(), activate(), suspend()
- Wallet.php : credit/debit avec DB locks, historique transactions
- StockService.php : reserve/release/deliver order flow, supplier receipt → stock in
- SubscriptionPlanSeeder.php : 3 plans (Essentiel/Pro/Business) avec limites exactes

### Frontend vérifié fonctionnel
- `npm run build` : succès (21.45s, ~650KB bundle)
- api.js : 50+ endpoints couvrant tous les nouveaux modules
- App.jsx : routes pour subscription, wallet, orders, suppliers, inventories, ataaba-admin

### Non-régression confirmée
- Routes existantes (sales, clients, articles, payments, shops, users, admin) intactes
- Multi-tenancy BelongsToTenant trait toujours appliqué
- QR codes ventes existants toujours accessibles (/api/qr/{uuid})
