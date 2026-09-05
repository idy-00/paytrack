# PayTrack — Decisions Log

## 2026-09-01 — Politique DexPay : frais à la charge du marchand

- L’abonnement PayTrack ne couvre aucun frais de transaction DexPay.
- Le client final paie strictement le montant de son achat. Les sessions DexPay envoient `client_support_fee: false`.
- À l’encaissement, le portefeuille est crédité exclusivement du net DexPay. Sans `merchant_net` ou `fee_amount` dans le webhook, aucun crédit brut n’est effectué.
- Pour un retrait, l’aperçu est calculé depuis les providers actifs retournés par DexPay ; aucun taux de payout n’est codé en dur.
- Le payout reçoit le net affiché au marchand ; après création, `fees`, `net_amount` et le débit wallet proviennent des montants réellement retournés par DexPay (`amount`, `fees`, `total_amount`).

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

## 2026-08-29 — Audit API Complet + Corrections Sécurité

### Audit exhaustif réalisé

**30 tests exécutés** via curl sur l'API en production :
- 29 OK (97%)
- 1 FAIL (création client - champ manquant dans test)

**Catégories testées :**
- Routes publiques : OK
- Authentification : OK
- Protection routes (token) : OK
- RBAC admin : OK (après fix)
- Dashboard, Clients, Articles : OK
- Stock, Wallet, KYC : OK
- Webhooks sécurité : OK
- Isolation multi-tenant : OK

### FAILLE CRITIQUE CORRIGÉE — RBAC Admin

**Problème découvert :** Les routes `/ataaba-admin/*` étaient accessibles par tout utilisateur authentifié.

**Impact :** N'importe quel marchand pouvait voir liste tenants, wallets, demandes retrait, KYC.

**Correction :**
- Nouveau middleware `EnsureSuperAdmin` (vérifie `role === 'super_admin'`)
- Ajouté aux routes `/ataaba-admin/*`
- Déployé : 2026-08-29 00:50 UTC

### Protection Double Payout vérifiée

Code déployé contient :
1. `lockForUpdate()` : verrou atomique DB
2. `DB::transaction()` : transaction complète
3. `isTransactionProcessed()` : idempotence webhook
4. Check `status === 'completed'` avant débit

### Migration DexPay complète

- DexPay remplace PayTech (Cash In) et Intech (Cash Out)
- Tests réels : Wave 100 XOF OK, Orange Money 100 XOF OK
- Providers : `wave_sn_payout`, `om_sn_payout`, `mixx_sn_payout`

### Fichiers créés

- `app/Http/Middleware/EnsureSuperAdmin.php`
- `AUDIT_API_2026-08-29.md`

---

## 2026-08-29 — Paiement Carte + Gestion Fonds Retenus

### Contexte

Activation du paiement carte bancaire via DexPay. Contrairement aux paiements mobile money (Wave/Orange Money) qui sont instantanés, les paiements carte ont des fonds retenus pendant plusieurs jours.

### Règles implémentées

1. **Délai de libération :**
   - 72h après encaissement : 80% des fonds deviennent disponibles
   - 7j (168h) après encaissement : 100% des fonds disponibles
   - Job planifié quotidien (03:00) pour libérer automatiquement

2. **Distinction dans le wallet :**
   - `balance` : solde disponible (retirable)
   - `held_balance` : fonds carte en attente de libération
   - `reserved_balance` : réserve de garantie (retenue DexPay)
   - `withdrawable_balance` : balance - reserved_balance

3. **Réserve de garantie :**
   - Admin ATAABA peut appliquer une réserve manuellement
   - Montant déduit du solde retirable
   - Peut être libéré ou converti en chargeback

4. **Chargebacks :**
   - Débit forcé possible même si solde négatif
   - Géré via webhook DexPay ou manuellement

### Modèle de données

**Nouveaux champs `wallets` :**
- `held_balance` (integer) : fonds carte en attente
- `reserved_balance` (integer) : réserve de garantie

**Nouveaux champs `wallet_transactions` :**
- `payment_method` : wave, orange_money, card, etc.
- `release_status` : immediate, held, partial, released
- `available_at` : date de libération prévue
- `held_amount`, `released_amount` : suivi libération progressive
- `special_type` : chargeback, reserve, etc.

**Nouvelle table `wallet_reserves` :**
- Historique des réserves de garantie
- Statuts : active, released, converted_to_chargeback

### Endpoints Admin ATAABA

| Route | Description |
|-------|-------------|
| `GET /ataaba-admin/card-funds` | Dashboard fonds carte |
| `GET /ataaba-admin/held-transactions` | Transactions en attente |
| `POST /ataaba-admin/held-transactions/{id}/release` | Libérer manuellement |
| `GET /ataaba-admin/reserves` | Liste réserves |
| `POST /ataaba-admin/reserves` | Créer réserve |
| `POST /ataaba-admin/reserves/{id}/release` | Libérer réserve |
| `POST /ataaba-admin/reserves/{id}/chargeback` | Convertir en chargeback |
| `POST /ataaba-admin/chargeback` | Chargeback direct |

### Non-régression

- Paiements Wave/Orange Money : crédit immédiat (inchangé)
- Validation retrait : KYC toujours requis
- Webhook DexPay : signature toujours vérifiée

### Fichiers créés/modifiés

- `database/migrations/2026_08_29_000001_add_card_payment_held_funds.php`
- `app/Models/Wallet.php` (méthodes creditHeld, forceDebit, etc.)
- `app/Models/WalletTransaction.php` (champs release)
- `app/Models/WalletReserve.php` (nouveau)
- `app/Jobs/ReleaseHeldCardFunds.php` (nouveau)
- `app/Http/Controllers/Api/Webhook/DexpayWebhookController.php`
- `app/Http/Controllers/Api/AtaabaAdminController.php`
- `app/Http/Controllers/Api/WalletController.php`
- `routes/api.php`, `routes/console.php`

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

---

## 2026-08-27 — Application charte graphique officielle

### Source
Charte graphique PayTrack produite par l'équipe infographes ATAABA : `logo PT.pdf`

### Couleurs officielles appliquées
| Rôle | Ancienne | Nouvelle |
|------|----------|----------|
| Bleu principal | `#1D6FE8` / `#0F52BA` | `#3768AF` |
| Vert succès/croissance | `#16A34A` / `#D4A017` (gold) | `#44AC45` |

### Typographie
- Ancienne : Geist (web), Inter/Space Grotesk (mobile)
- Nouvelle : **Source Sans 3** (web + mobile)

### Logo
- Recréé en SVG fidèle à la charte (barres ascendantes + trajectoire + P)
- 3 versions : `logo.svg` (symbole), `logo-symbol.svg`, `logo-full.svg` (avec texte)
- Favicon SVG créé
- **Note** : extraction vectorielle du PDF impossible, logo recréé manuellement

### Fichiers modifiés

**Frontend :**
- `tailwind.config.js` — couleurs + police
- `index.html` — Google Fonts Source Sans 3
- `index.css` — toutes les couleurs
- `components/ui/Logo.jsx` — nouveau composant SVG
- `components/ui/ProgressBar.jsx` — couleurs
- `components/layout/AppLayout.jsx` — couleurs
- `lib/utils.js` — couleurs badges
- `lib/mockData.js` — couleurs badges
- Toutes les pages JSX — remplacement `#1D6FE8`→`#3768AF`, `#16A34A`→`#44AC45`
- `public/assets/` — nouveaux SVG logo
- `public/favicon.svg` — nouveau favicon

**Mobile :**
- `lib/core/theme/app_colors.dart` — palette complète
- `lib/core/theme/app_theme.dart` — police + colorScheme

### Bugs/incohérences corrigés au passage
- Anciennes couleurs gold/ambre remplacées par vert charte
- Gradient heroGradient mis à jour avec nouveaux bleus
- Badge couleurs uniformisées

### Build vérifié
- Frontend : `npm run build` ✅ (14.49s)

### Bloquant restant
- **Icônes app mobile (launcher icons)** : les PNG `ic_launcher.png` utilisent l'ancien logo. Nécessite regénération via `flutter_launcher_icons` avec le nouveau SVG converti en PNG haute résolution.

---

## 2026-08-27 — Nouvelle tarification (sans Wallet, avec Facturation)

### Source
Document `Tarification_PayTrack_sans_Wallet_avec_Facturation.docx`

### Nouvelle grille tarifaire

| Formule | Jour | Semaine | Mois | 3 mois | An |
|---------|------|---------|------|--------|-----|
| **Essentiel** | 100 F | 500 F | 2 000 F | 5 500 F | 20 000 F |
| **Pro** | 250 F | 1 250 F | 5 000 F | 13 500 F | 50 000 F |
| **Business** | 500 F | 2 500 F | 10 000 F | 27 000 F | 100 000 F |

### Positionnement
- **Essentiel** : petits commerçants, artisans — produit d'appel
- **Pro** : TPE, boutiques — **formule à pousser** (meilleur équilibre)
- **Business** : PME, équipes structurées

### Offre de lancement
- Abonnement annuel = **1 mois gratuit**
- Parrainage = 1 mois offert après 5 nouveaux abonnés

### Module Wallet retiré
- **Décision annulée le 29 août 2026** : le wallet reste un pilier produit.
- Le portefeuille marchand, les retraits et le paiement routé via DexPay sont conservés.
- Cette mention historique ne doit plus servir de référence pour les développements futurs.

### Fichiers modifiés

**Backend :**
- `database/migrations/2026_08_27_000001_add_pricing_tiers_to_subscription_plans.php` — nouvelles colonnes (price_daily, price_weekly, price_quarterly, description)
- `database/seeders/SubscriptionPlanSeeder.php` — nouveaux tarifs + features
- `app/Models/SubscriptionPlan.php` — nouveaux champs fillable/casts

**Frontend :**
- `pages/SubscriptionPage.jsx` — 5 options de durée + offre annuelle
- `pages/LandingPage.jsx` — nouvelle grille tarifaire
- `components/layout/AppLayout.jsx` — Wallet retiré du menu

**Mobile :**
- `features/subscription/subscription_screen.dart` — 5 options de durée
- `features/dashboard/dashboard_screen.dart` — Portefeuille → Paiements dans nav bar

### Build vérifié
- Frontend : `npm run build` ✅
- Mobile : `flutter analyze` ✅ (0 erreurs)

### À faire après déploiement
1. Exécuter `php artisan migrate` sur Hostinger
2. Exécuter `php artisan db:seed --class=SubscriptionPlanSeeder` pour mettre à jour les plans

---

## 2026-08-28 — Migration vers DexPay (agrégateur paiements)

### Changement d'agrégateur
- **Ancien** : PayTech (INTECH GROUP)
- **Nouveau** : DexPay (DEXCHANGE PAY)
- **Raison** : DexPay offre une couverture multi-opérateurs (Wave, Orange Money, MTN, Moov) avec une seule intégration

### Clés API (Production - ATAABA)
- Public Key : à fournir via l’environnement sécurisé (non versionnée)
- Secret Key : configuré dans `.env`
- Dashboard : https://app.dexpay.africa
- Docs : https://docs.dexpay.africa

### Fichiers créés
- `app/Services/DexpayService.php` — Service principal
- `app/Services/Payment/Gateways/DexpayGateway.php` — Gateway unifié
- `app/Models/DexpayWebhook.php` — Model pour logs webhooks
- `app/Http/Controllers/Api/Webhook/DexpayWebhookController.php` — Webhook handler
- `database/migrations/2026_08_28_000001_create_dexpay_webhooks_table.php` — Table webhooks

### Fichiers modifiés
- `config/services.php` — Config DexPay ajoutée
- `routes/api.php` — Route webhook `/api/webhooks/dexpay`
- `app/Services/Payment/PaymentGatewayFactory.php` — DexPay comme gateway principal
- `.env.example` — Variables DexPay documentées
- `.env` — Clés production configurées

### Webhook URL à configurer dans DexPay Dashboard
```
https://api.paytrack.sn/api/webhooks/dexpay
```

### Événements webhook supportés
- `checkout.initiated` — Session créée
- `checkout.completed` — Paiement réussi ✅
- `checkout.failed` — Paiement échoué

---

## 2026-08-29 — Correction transversale et refonte mobile complète

### Direction visuelle définitive

- La charte `logo PT.pdf` a été relue intégralement avant les changements.
- Palette officielle : bleu `#3768AF` pour la structure et les données financières, vert `#44AC45` pour les actions, la progression et la croissance.
- Répartition visuelle visée : environ 60 % bleu / 35 % vert, complétée par les neutres nécessaires à la lisibilité.
- Aucun dégradé n'est utilisé dans l'application mobile ni dans le frontend web.
- La typographie commune est Source Sans 3.
- Le splash screen utilise une photographie réelle de marché sénégalais, avec attribution documentée dans `ATTRIBUTIONS.md`.
- La refonte concerne tous les parcours : authentification, tableaux de bord, ventes, paiements, QR, clients, commandes, stocks, inventaires, fournisseurs, wallet, abonnement, profil et écrans légaux.

### Décisions fonctionnelles et techniques

- Le wallet marchand et les retraits restent dans le produit ; DexPay est l'unique intégration de paiement active.
- Les anciennes classes, routes et configurations PayTech ont été retirées du runtime. Les anciens noms encore visibles ne subsistent que dans les migrations et le SQL historiques nécessaires à la traçabilité de la base.
- Les routes statiques Flutter sont déclarées avant les routes paramétrées et les identifiants sont analysés sans crash.
- Les réponses API hétérogènes sont normalisées par des parseurs tolérants ; une réponse 401 est une erreur explicite et ne peut plus être interprétée comme un succès vide.
- Les jetons natifs restent exclusivement dans le stockage sécurisé ; les journaux ne contiennent plus de token, d'en-tête sensible ou de payload complet.
- La création de vente suit exactement le contrat API et distingue explicitement comptant/crédit. L'aperçu d'échéancier répartit le reliquat d'arrondi et garantit que la somme ne dépasse jamais le montant restant.
- La quantité vendue est persistée et la décrémentation de stock est atomique pour la quantité réelle.
- Les commandes DexPay utilisent une référence unique, une URL validée et un identifiant de checkout dédié. Le webhook crée un paiement de commande idempotent.
- Les pages web lourdes et les graphiques sont chargés à la demande.

### Validation réalisée

- Backend : `php artisan test` — 24 tests, 70 assertions, succès.
- Mobile : `flutter analyze` — aucune anomalie.
- Mobile : `flutter test` — 10 tests, succès.
- Mobile web : build de production Flutter, succès.
- Frontend web : `npm run build`, succès avec découpage en chunks.
- Contrôle visuel : splash et connexion capturés depuis le build de production ; application relancée dans Chrome sur `http://localhost:5176`.
- Rapport : `Rapport_Correction_Redesign_Mobile_PayTrack_2026-08-29.docx`, 21 pages validées.

### Déploiement

- Les migrations datées du 29 août 2026 doivent être exécutées sur Hostinger après mise en production du backend.
- Le webhook DexPay doit être configuré et vérifié dans la console du prestataire avec des secrets renouvelés.
- `checkout.cancelled` — Session annulée
- `checkout.refunded` — Remboursement
- `subscription.*` — Événements abonnements

### Signature webhook
- Header : `x-dexchange-signature`
- Algorithme : HMAC-SHA256 avec la clé secrète

### Tests réels effectués (2026-08-28 22:00 UTC)

| Test | Résultat | Détails |
|------|----------|---------|
| GET /checkout-sessions | ✓ SUCCÈS | API répond correctement |
| POST /checkout-sessions | ✓ SUCCÈS | Session TEST-1787954686 créée, payment_url généré |
| POST /products (récurrent) | ✓ SUCCÈS | Produit ID 6a9206766df25244b817ef1a créé |
| POST /customers | ✓ SUCCÈS | Client ID 6a920684bd37fdce17267d5a créé |
| POST /subscriptions | ✓ SUCCÈS | Abonnement avec payment_url pour 1er paiement |
| Signature webhook | ✓ SUCCÈS | HMAC-SHA256 vérifié correctement |
| POST /payouts | ✗ ÉCHEC | "Payout provider 'wave' not found" |

### Conclusion tests

**FONCTIONNEL :**
- Encaissement (Cash In) via checkout sessions
- Abonnements récurrents natifs (monthly, weekly, etc.)
- Webhooks avec signature HMAC-SHA256
- Multi-devises (XOF, XAF, GNF, USD, EUR)

**BLOQUÉ :**
- Payout/CashOut vers numéros tiers (Wave, Orange Money)
- Aucun provider de payout configuré sur le compte ATAABA

### Architecture finale (mise à jour 2026-08-28)

**DÉCISION : Abandon complet d'Intech, DexPay comme unique prestataire**

Raison : Le préchargement obligatoire de 10 000 000 FCFA chez Intech n'est pas viable pour ATAABA.

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUX PAIEMENTS PAYTRACK v2                    │
│                     (DexPay uniquement)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CASH IN (encaissement)              CASH OUT (retrait)         │
│  ─────────────────────               ─────────────────          │
│  • Paiements clients                 • Retraits marchands       │
│  • Abonnements boutiques             • wave_sn_payout (1.5%)    │
│  • Wave, Orange, MTN, Moov           • om_sn_payout (1.4%)      │
│                                                                 │
│       ┌───────────────────────────────────────┐                 │
│       │                                       │                 │
│       │          DEXPAY ATAABA                │                 │
│       │     (compte unique Cash In/Out)       │                 │
│       │                                       │                 │
│       │  Solde alimenté par encaissements     │                 │
│       │  + virements manuels si besoin        │                 │
│       │                                       │                 │
│       └───────────────────────────────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Providers DexPay disponibles (compte ATAABA - 17 au total)

**Encaissement (Cash In) :**
| Provider | Pays | Frais |
|----------|------|-------|
| wave_sn | Sénégal | 1.5% |
| om_sn | Sénégal | 1.5% |
| mixx_sn | Sénégal | 1.5% |
| mtn_ci | Côte d'Ivoire | 1.5% |
| mtn_cm | Cameroun | 2.7% |
| om_ci | Côte d'Ivoire | 2.5% |
| om_cm | Cameroun | 2.7% |
| om_gn | Guinée | 2.5% |

**Retrait (Cash Out) :**
| Provider | Pays | Frais |
|----------|------|-------|
| wave_sn_payout | Sénégal | 1.5% |
| om_sn_payout | Sénégal | 1.4% |
| mixx_sn_payout | Sénégal | 1.5% |
| mtn_ci_payout | Côte d'Ivoire | 1.5% |
| mtn_cm_payout | Cameroun | 1.8% |
| om_ci_payout | Côte d'Ivoire | 2% |
| om_cm_payout | Cameroun | 1.8% |
| om_gn_payout | Guinée | 1.5% |
| moov_ci_payout | Côte d'Ivoire | 2% |

### À faire après déploiement
1. Exécuter `php artisan migrate` pour créer la table `dexpay_webhooks`
2. Configurer le webhook URL dans le dashboard DexPay : `https://api.paytrack.sn/api/webhooks/dexpay`
3. **CRITIQUE** : Alimenter le compte ATAABA DexPay (solde actuel : 0 XOF)

### 2026-09-02 — Validation retrait DexPay sandbox sur Hostinger

- Politique appliquée : le montant saisi pour un retrait est un montant brut ; DexPay reçoit uniquement le net estimé afin que le marchand supporte les frais sans surcharge côté client.
- Preuve réelle, Wave sandbox, demande de `10 000 XOF` : DexPay a reçu `9 850 XOF`, a retourné `fee_amount=148` et `merchant_net=9 998`; `WithdrawalRequest` a enregistré `net_amount=9 850`, `fees=148` et le wallet a été débité de `9 998`.
- Le devis était de `150 XOF`, calculé depuis le tarif retourné par DexPay. L’écart de `2 XOF` est le recalcul réel du prestataire sur le montant envoyé; le montant final enregistré provient de sa réponse, jamais d’un taux codé en dur.
- Migration `2026_09_02_000002_add_dexpay_payout_columns_to_withdrawal_requests` ajoutée et exécutée sur Hostinger : elle fournit les références DexPay utilisées par le parcours de retrait et évite les doubles traitements.
- Carte maintenue désactivée : `DEXPAY_CARD_ENABLED=false` sur Hostinger, jusqu’à confirmation contractuelle de DexPay.
# 2026-08-29 — Remédiation audit : décisions appliquées

- Le wallet DexPay (encaissement routé, portefeuille marchand et retraits) demeure le modèle produit de référence.
- Les références nouvelles utilisent maintenant des ULID ; les contraintes uniques existantes en base sont conservées.
- Les échéanciers répartissent les arrondis sans jamais dépasser le reste à payer.
- Les fréquences `quotidien` et `personnalise` sont désormais prévues dans le contrat backend ; la migration `2026_08_29_110000_align_sale_frequencies` doit être exécutée avant déploiement.
- Une CI et un garde-fou pre-commit de détection de secrets ont été ajoutés. Activer le hook avec `git config core.hooksPath .githooks` sur chaque poste.
- L’historique Git distant confirme une exposition antérieure de secrets. La suppression des fichiers courants ne remplace pas une rotation chez les fournisseurs ni une purge contrôlée de l’historique.
