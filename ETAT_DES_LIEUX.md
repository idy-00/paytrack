# PayTrack — État des Lieux (2026-08-09)

## Résumé Exécutif

| Composant | État Réel |
|-----------|-----------|
| **Backend Laravel** | 100% codé, DÉPLOYÉ Hostinger, 17 nouvelles tables |
| **Frontend Web React** | 100% API - appels réels (api.js 50+ endpoints) |
| **Mobile Flutter** | 90% - connexion API partielle |
| **Base de données** | Migrations exécutées, seeders prêts |
| **Hébergement** | Hostinger (lightsalmon-eel-638395.hostingersite.com) |
| **Paiements** | PayTech intégré (attente clés API), Wave/Orange ready |

## Nouveaux modules (2026-08-08)

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| **Abonnements** | ✅ | ✅ | 3 plans, trial 14j, alertes expiration |
| **Portefeuille** | ✅ | ✅ | Credit/debit, demandes retrait |
| **Commandes clients** | ✅ | ✅ | Statuts, paiements, QR, stock réservé |
| **Commandes fournisseurs** | ✅ | ✅ | Business plan only, dettes, réceptions |
| **Stock avancé** | ✅ | ✅ | Réservé/disponible, mouvements, inventaires |
| **Dashboard ATAABA** | ✅ | ✅ | Super admin pour retraits, abonnements |
| **PayTech webhooks** | ✅ | N/A | HMAC, idempotence, logging |

## 1. Backend Laravel — Analyse Détaillée

### CE QUI EXISTE ET FONCTIONNE (code prêt)

#### Authentification Sanctum ✅
- `AuthController.php` : login/logout/me complets
- Rate limiting 5 tentatives/minute
- Tokens avec expiration 8h
- Audit log des connexions

#### Multi-tenancy ✅
- `BelongsToTenant` trait avec scope automatique
- `EnsureTenantAccess` middleware
- Isolation complète par tenant_id

#### API Sales ✅
- CRUD complet avec validation tenant-scoped
- Génération automatique d'échéancier
- QR UUID unique par vente
- Endpoint public `/qr/{uuid}` avec masquage nom

#### Paiements manuels ✅
- `PaymentController.php` fonctionnel
- Verrouillage pessimiste (race condition safe)
- Mise à jour automatique du statut vente

#### Intégrations paiement ✅
- **Wave Business** : prêt, attend API key
- **Orange Money** : prêt, désactivé (attend code marchand)
- **Free Money** : skip V1

#### Notifications ✅
- SMS via Africa's Talking ou Twilio
- WhatsApp via Meta Cloud API
- Email via Brevo SMTP/API
- Push via Firebase FCM

#### Stockage fichiers ✅
- Cloudflare R2 / S3 compatible
- Organisation par tenant
- QR Code generation

#### Jobs/Queue ✅
- `ProcessSuccessfulPayment` (idempotent)
- `SendPaymentReminders` (J-1 + relances)
- `SendWeeklySummary`

### CE QUI EST CASSÉ / MANQUANT

| Fichier | Problème |
|---------|----------|
| `app/Models/User.php` | **CRITIQUE** - Manque `HasApiTokens` + `HasRoles` traits. Auth Sanctum cassée. |
| `app/Models/Shop.php` | **MANQUANT** - Référencé partout mais n'existe pas |
| `app/Http/Controllers/Api/ClientController.php` | **MANQUANT** - Route définie mais controller absent |
| `app/Http/Controllers/Api/ArticleController.php` | **MANQUANT** - Route définie mais controller absent |
| `app/Notifications/PaymentReminderNotification.php` | **MANQUANT** - Job l'appelle mais n'existe pas |
| `database/seeders/RoleSeeder.php` | **MANQUANT** - Aucun seeder pour les rôles Spatie |

### Migrations
Complètes et correctes : tenants, shops, clients, articles, sales, payments, sale_schedules, audit_logs.

---

## 2. Frontend Web React — Analyse Détaillée

### Architecture
- React + Vite + Tailwind
- Zustand pour state management (persist localStorage)
- React Router pour navigation

### État Réel : 100% MAQUETTE

#### Données
Tout vient de `lib/mockData.js` :
- `MOCK_USERS` - comptes en dur
- `MOCK_CLIENTS` - 5 clients fake
- `MOCK_ARTICLES` - 5 articles fake
- `MOCK_SALES` - 5 ventes fake

#### Authentification
```javascript
// LoginPage.jsx - FAKE AUTH
if (email === 'moussa@phoneshop-dakar.com' && password === 'demo1234') {
  login(MOCK_USERS.vendeur, 'fake-token-123')
}
```
Aucun appel API. Comparaison string en dur.

#### Stores Zustand
- `authStore.js` : persist localStorage, pas d'API
- `clientStore.js` : persist localStorage, pas d'API
- `saleStore.js` : persist localStorage, pas d'API
- `stockStore.js` : persist localStorage, pas d'API

#### Actions utilisateur
- Créer vente → ajoute au store local
- Créer client → ajoute au store local
- Modifier stock → ajoute au store local
Rien ne part vers un serveur.

### Ce qui "marche" visuellement
- Dashboard avec stats (mock)
- Liste clients/ventes/paiements (mock)
- Création vente comptant/tranche (stocké local)
- Fréquences personnalisées (stocké local)
- Gestion stock (stocké local)
- Protection routes par rôle (vérif locale)
- QR codes (UUID généré côté client)

### Ce qui ne marche PAS réellement
- Authentification (fake)
- Persistance des données (localStorage = perdu si clear)
- Multi-utilisateur (chacun a ses propres données locales)
- PDF/reçus (pas générés)
- Notifications SMS/Email (pas envoyées)

---

## 3. Mobile Flutter — Analyse Détaillée

### Architecture
- 21 fichiers Dart
- Provider pour state management
- GoRouter pour navigation

### État Réel : 100% MAQUETTE

#### Données
Tout vient de `lib/data/mock/mock_data.dart` :
- `mockSales` - 5 ventes identiques au web
- `mockClients` - 5 clients identiques au web
- `dashboardStats` - stats en dur

#### Authentification
```dart
// auth_provider.dart - Probablement fake aussi
```
Pas d'appel HTTP visible.

### Écrans existants
- Login
- Dashboard vendeur
- Dashboard client
- Liste ventes
- Détail vente
- Liste clients
- Paiements
- QR Scanner

### Ce qui manque
- Connexion API réelle
- Synchronisation avec web
- Push notifications configurées
- Génération PDF

---

## 4. Ce Qui Manque Pour Production

### Backend — À réparer (2-3h)
1. ✏️ Corriger `User.php` (ajouter traits)
2. ✏️ Créer `Shop.php` model
3. ✏️ Créer `ClientController.php`
4. ✏️ Créer `ArticleController.php`
5. ✏️ Créer `PaymentReminderNotification.php`
6. ✏️ Créer `RoleSeeder.php` + `TenantSeeder.php`
7. ✏️ Ajouter endpoint `POST /auth/register`

### Frontend — À réécrire (8-12h)
1. 🔄 Créer `lib/api.js` (client HTTP avec token)
2. 🔄 Réécrire `authStore.js` (appels API réels)
3. 🔄 Réécrire `clientStore.js` (appels API réels)
4. 🔄 Réécrire `saleStore.js` (appels API réels)
5. 🔄 Réécrire `stockStore.js` (appels API réels)
6. 🔄 Supprimer toutes les références à mockData
7. 🔄 Ajouter gestion erreurs réseau
8. 🔄 Ajouter loading states

### Mobile — À connecter (6-8h)
1. 🔄 Créer service API Dio/http
2. 🔄 Remplacer mock par appels réels
3. 🔄 Configurer FCM pour push
4. 🔄 Synchroniser avec web

### Infrastructure — À créer
1. 🖥️ VPS pour héberger backend (MySQL + PHP + Queue worker)
2. 🌐 Domaine + SSL
3. 🔑 Credentials services externes (Wave, Brevo, etc.)

---

## 5. Services Externes — Options Gratuites

| Service | Option gratuite | Limite |
|---------|----------------|--------|
| **Email** | Brevo | 300 emails/jour |
| **SMS** | Africa's Talking sandbox | Test seulement |
| **Push** | Firebase FCM | Illimité |
| **Stockage** | Cloudflare R2 | 10 Go/mois |
| **Hébergement** | ❌ Aucun gratuit viable | Voir BLOQUANTS.md |

---

## 6. Verdict Final

### Ce qui est RÉEL
- Code backend Laravel solide (mais incomplet)
- UI React bien faite (mais fake)
- UI Flutter basique (mais fake)
- Design system cohérent
- Architecture multi-tenant correcte

### Ce qui est FAKE
- **TOUT le reste** : aucune donnée persiste sur un serveur, aucune notification part, aucun paiement mobile money fonctionne, aucun PDF n'est généré.

### Travail restant estimé
- Backend fixes : **3 heures**
- Frontend réécriture API : **12 heures**
- Mobile connexion API : **8 heures**
- Tests + debug : **8 heures**
- Déploiement : **4 heures**
- **Total : ~35 heures de travail**

### Blockers absolus
1. **VPS** - Pas d'hébergement gratuit viable pour Laravel + MySQL + Queue
2. **Domaine** - Nécessaire pour SSL et URLs propres
3. **Wave API Key** - Compte Wave Business requis
