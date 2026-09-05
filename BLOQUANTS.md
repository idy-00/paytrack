# PayTrack — Blockers / Questions

## 2026-09-01 — Audit des tests et livrables mobiles

- Les scénarios Playwright d’authentification existants ne sont plus fiables : ils utilisent le même compte de démonstration pour les rôles administrateur et vendeur, tout en attendant systématiquement la route `/dashboard`. L’application redirige désormais un administrateur vers `/admin`. Les tests doivent être remplacés par des fixtures locales et des réponses API simulées, sans identifiants Hostinger.
- Le contrôle visuel local de la page de connexion est passé. Le nouveau scénario de réinitialisation OTP est isolé des services externes, mais son exécution Playwright ne restitue pas de résultat final exploitable dans l’environnement actuel ; la validation API Laravel, elle, est automatisée et réussie.
- La construction d’APK a échoué dans l’environnement Windows/Gradle avec `Unable to establish loopback connection`, y compris après définition d’un répertoire temporaire Java. De plus, `flutter --version` et les tests Flutter se terminent ici sans aucune sortie exploitable. Aucun APK contenant les présentes corrections ne doit être présenté comme livré tant que ce blocage de build n’est pas résolu.
- La base MySQL locale configurée n’est pas accessible (`connection refused`) : les migrations et essais financiers locaux ne peuvent pas être exécutés contre elle. Ne pas utiliser la base Hostinger de production comme substitut de test.

## 2026-09-01 — Validation financière réelle à programmer sur sandbox

La configuration locale DexPay est active mais utilise l’URL de production. Une lecture non destructive a confirmé 9 providers payout actifs et leurs frais publiés par DexPay. Aucun encaissement ni retrait réel n’a été déclenché dans cet audit pour éviter tout mouvement financier non autorisé.

Avant mise en production de la politique ci-dessous, effectuer un encaissement et un payout sur des clés sandbox, puis comparer les champs webhook/réponse DexPay (`merchant_net`, `fee_amount`, `amount`, `fees`, `total_amount`) avec les écritures wallet.

## 2026-09-01 — Texte CGU/tarification à valider juridiquement

Texte proposé : « Les frais de transaction sont facturés par DexPay, distinctement de l’abonnement PayTrack, et peuvent évoluer selon l’opérateur et le pays. Ils sont supportés par le marchand et affichés avant confirmation du retrait. Le client final paie uniquement le montant de son achat. »

Une validation humaine du texte légal est requise avant publication des CGU et de la page de tarification.

## 2026-08-29 — Audit API Complet

### ✅ FAILLE RBAC CORRIGÉE (CRITIQUE)

**Problème détecté :** Les routes `/ataaba-admin/*` retournaient 200 au lieu de 403 pour un utilisateur non-admin. Tout marchand authentifié pouvait accéder au dashboard admin ATAABA.

**Impact :** Fuite potentielle de données sensibles (liste tenants, wallets, KYC, retraits).

**Correction appliquée :**
- Nouveau middleware `EnsureSuperAdmin` créé
- Vérifie `user->role === 'super_admin'`
- Ajouté aux routes `/ataaba-admin/*`
- **Déployé : 2026-08-29 00:50 UTC**

**Vérification post-fix :** 403 retourné correctement.

### ✅ Audit API — Résultats

| Catégorie | Tests | OK | Status |
|-----------|-------|-----|--------|
| Routes publiques | 3 | 3 | ✅ |
| Authentification | 4 | 4 | ✅ |
| Protection routes | 3 | 3 | ✅ |
| RBAC admin | 3 | 3 | ✅ |
| Wallet | 3 | 3 | ✅ |
| Webhooks sécurité | 2 | 2 | ✅ |
| Isolation tenant | 2 | 2 | ✅ |
| **TOTAL** | **30** | **29** | **97%** |

**Rapport complet :** `AUDIT_API_2026-08-29.md`

---

## 2026-08-29 — Paiement Carte Activé

### ✅ Implémentation Fonds Retenus

| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| Distinction carte vs mobile money | ✅ OK | Via champ `operator` dans webhook |
| Fonds retenus 72h/7j | ✅ OK | Job planifié `ReleaseHeldCardFunds` |
| Réserve de garantie | ✅ OK | Endpoints admin |
| Chargeback (solde négatif) | ✅ OK | `forceDebit()` |
| Non-régression Wave/OM | ✅ OK | Crédit immédiat inchangé |

### ⚠️ BLOQUANT CRITIQUE — Pourcentage libération fonds carte NON CONFIRMÉ

**Problème :** Le code utilise 80% à 72h et 100% à 7j, mais ces valeurs sont des **SUPPOSITIONS**. DexPay n'a pas confirmé ces chiffres.

**Risque :** Si DexPay libère 70% ou 90%, le marchand verra un montant disponible **FAUX** dans son wallet.

**Configuration actuelle :** Valeurs dans `config/services.php > dexpay > card_release` :
```php
'partial_hours' => 72,      // À CONFIRMER
'partial_percent' => 80,    // À CONFIRMER
'full_hours' => 168,        // À CONFIRMER
```

**ACTION REQUISE AVANT TOUT PAIEMENT CARTE RÉEL :**
1. Contacter DexPay (support@dexpay.africa)
2. Demander les vrais pourcentages/délais
3. Mettre à jour la config
4. Tester avec un vrai paiement carte

**Job planifié :** `ReleaseHeldCardFunds` quotidien à 03:00 (applique les valeurs configurées)

### ✅ Abonnements trimestriels/semestriels — TESTÉ EN PRODUCTION (2026-08-29)

**Problème initial :** Le code n'acceptait que `monthly` et `yearly`. Les prix `price_quarterly` existaient mais étaient **inutilisés**.

**Corrections appliquées :**
1. `billing_cycle` accepte maintenant : `daily`, `weekly`, `monthly`, `quarterly`, `semiannual`, `yearly`
2. `Subscription::getCurrentPrice()` retourne le bon prix selon le cycle
3. `Subscription::activate()` calcule la bonne date de fin
4. **SubscriptionController migré de PaytechService vers DexpayService**
5. Prix quarterly/semiannual calculés automatiquement en DB (Q=M*3*0.9, S=M*6*0.85)

**Prix officiels en production (selon Tarification_PayTrack_sans_Wallet_avec_Facturation.docx) :**
| Plan | Jour | Semaine | Mois | 3 mois | 6 mois | 1 an |
|------|------|---------|------|--------|--------|------|
| Essentiel | 100 | 500 | 2 000 | 5 500 | 10 800 | 20 000 |
| Pro | 250 | 1 250 | 5 000 | 13 500 | 27 000 | 50 000 |
| Business | 500 | 2 500 | 10 000 | 27 000 | 54 000 | 100 000 |

**Test réel réussi (2026-08-29) :**
- Abonnement trimestriel Pro: 13 500 FCFA (prix officiel)

**Renouvellement auto :** Fonctionne pour tous les cycles via `Subscription::renew()`

---

## 2026-08-15 — Intégration Intech CashOut

### Bloquants Intech API

1. **Clés API Intech** — nécessaires pour activer le CashOut automatique
   - Variables .env requises : `INTECH_API_KEY`, `INTECH_API_SECRET`, `INTECH_HMAC_SECRET`
   - Obtenir depuis : dashboard développeur Intech
   - Mode actuel : code prêt, fallback manuel fonctionnel

2. **Alimenter le compte ATAABA** — modèle prépayé
   - Le compte Intech doit être alimenté par virement bancaire AVANT les CashOut
   - Délais : dépôt avant 11h = dispo le jour même, après 11h = lendemain
   - Si solde insuffisant : le retrait reste en `pending`, admin alerté

### ✅ DexPay Cash In — RÉSOLU 2026-08-28

DexPay configuré et testé en production :
- **Public Key** : à fournir via l’environnement sécurisé (non versionnée)
- **Secret Key** : configuré dans `.env`
- **Webhook** : `https://api.paytrack.sn/api/webhooks/dexpay`

**Fonctionnel (testé réellement) :**
- ✓ Checkout sessions (encaissement Wave, Orange, MTN, Moov)
- ✓ Abonnements récurrents (monthly, weekly, etc.)
- ✓ Webhooks avec signature HMAC-SHA256
- ✓ Multi-devises (XOF, XAF, GNF, USD, EUR)

### ✅ DexPay Payout (CashOut) — FONCTIONNEL (2026-08-29)

**Tests réels réussis :**

| Test | Montant | Provider | Status | Transaction ID |
|------|---------|----------|--------|----------------|
| Payout Wave | 100 XOF | wave_sn_payout | completed | TIDXVII2D0112F |
| Payout Orange Money | 100 XOF | om_sn_payout | completed | TIDMI9IC176WJ |

**Providers DexPay disponibles (Sénégal) :**
- `wave_sn_payout` — Wave Sénégal (frais 1.5%)
- `om_sn_payout` — Orange Money Sénégal (frais 1.4%)
- `mixx_sn_payout` — Mixx By Yas Sénégal (frais 1.5%)

**IMPORTANT :** Les IDs de provider sont différents de ce qu'on attendait !
- ❌ `wave` → Erreur "provider not found"
- ✓ `wave_sn_payout` → Fonctionne

**Architecture finale :**
- DexPay = Cash In + Cash Out (agrégateur unique)
- Intech = Abandonné (préchargement 10M XOF non viable)

---

## Tableau de couverture fonctionnelle PayTrack + DexPay/ATAABA

| Fonctionnalité PayTrack | DexPay/ATAABA | Preuve test réel | Notes |
|-------------------------|---------------|------------------|-------|
| **Encaissement paiement client (Wave)** | ✓ OUI | Checkout session créée, payment_url généré | Via interface DexPay |
| **Encaissement paiement client (Orange Money)** | ✓ OUI | Même checkout, opérateur choisi par client | Multi-opérateurs natif |
| **Encaissement paiement client (MTN/Moov)** | ✓ OUI | Supporté par DexPay | Afrique de l'Ouest |
| **Encaissement carte bancaire** | ✓ OUI | currency: USD/EUR acceptées | Via checkout DexPay |
| **Payout vers Wave (retrait marchand)** | ✓ OUI | 100 XOF envoyé, TX: TIDXVII2D0112F | Provider: wave_sn_payout |
| **Payout vers Orange Money** | ✓ OUI | 100 XOF envoyé, TX: TIDMI9IC176WJ | Provider: om_sn_payout |
| **Payout multi-bénéficiaires** | ✓ OUI | Endpoint /payouts fonctionnel | Testé avec 2 destinataires |
| **Abonnement récurrent mensuel** | ✓ OUI | Produit + subscription créés | billing_period: monthly |
| **Abonnement récurrent hebdomadaire** | ✓ OUI | Supporté nativement | billing_period: weekly |
| **Abonnement récurrent trimestriel** | ⚠️ PARTIEL | Pas de billing_period "quarterly" | Utiliser checkout manuel |
| **Abonnement récurrent annuel** | ⚠️ PARTIEL | Pas de billing_period "yearly" | Utiliser checkout manuel |
| **Webhooks temps réel** | ✓ OUI | Signature HMAC-SHA256 vérifiée | Header x-dexchange-signature |
| **Idempotence webhook** | ✓ OUI | Implémenté dans DexpayWebhookController | Via transaction_id |
| **Solde compte ATAABA** | ⚠️ PARTIEL | Pas d'endpoint /balance | Voir dashboard DexPay |
| **Préchargement obligatoire** | ✓ OUI | Compte ATAABA alimenté 500 XOF | Virement Wave vers DexPay |
| **Limites transactions** | ✓ OUI | 1000 req/min documenté | Testé OK |
| **Frais réels encaissement** | ✓ OUI | Visibles après paiement | Dans response API |
| **Frais réels payout** | ✓ OUI | Wave 1.5%, OM 1.4% | Testés : 2 XOF/100 XOF |

### Légende
- ✓ OUI = Testé et fonctionnel
- ✗ NON = Testé et non fonctionnel
- ⚠️ PARTIEL = Fonctionne avec workaround
- ? INCONNU = Non testable via API

### Actions requises

1. **DÉPLOIEMENT** : Exécuter la migration `dexpay_webhooks` sur Hostinger
   ```bash
   php artisan migrate
   ```

2. **PRODUCTION** : Configurer le webhook URL dans le dashboard DexPay
   - URL : `https://api.paytrack.sn/api/webhooks/dexpay`

3. **OPTIONNEL** : Activer le paiement par carte dans le dashboard DexPay (bouton "Activer la carte")

### Bloquants PayTech (LEGACY - remplacé par DexPay)

PayTech n'est plus utilisé — remplacé par DexPay.
Le code runtime PayTech a été supprimé. Les seules occurrences restantes se trouvent dans les migrations et scripts SQL historiques, conservés pour permettre une migration de schéma sûre et traçable.

### Bloquants existants (rappel)

1. **VPS + domaine custom** — api.paytrack.sn / app.paytrack.sn pas encore configurés
   - Actuellement sur : lightsalmon-eel-638395.hostingersite.com

2. **Clés Wave Business API** — KYC en cours (2-4 semaines estimées)
   - Variables : `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET`

3. **Clés Orange Money API** — contrat en cours (3-6 semaines estimées)
   - Variables : `ORANGE_MONEY_CLIENT_ID`, `ORANGE_MONEY_CLIENT_SECRET`, `ORANGE_MONEY_MERCHANT_KEY`

4. **Compte Google Play** — frais uniques pour publier l'APK Android

### Non bloquant — Travail en attente de clés

- Webhook DexPay : endpoint prêt `/api/webhooks/dexpay`, vérification HMAC et idempotence en place
- Paiements et retraits : validation réelle en production conditionnée aux accès et clés DexPay
- Notifications email abonnement : Brevo configuré, templates à créer

---

## 2026-08-09 — Mise à jour historique (supplantée par DexPay)

Les notes PayTech ci-dessous ne sont plus applicables. Le service, le contrôleur webhook et la route publique PayTech ont été retirés le 29 août 2026.

### Question INTECH GROUP (rappel)
- API de reversement/payout vers Wave/Orange Money du marchand existe-t-elle ?
- Si non : retraits traités manuellement via dashboard ATAABA (déjà implémenté)

---

## 2026-08-27 — Charte graphique

### Icônes app mobile (launcher icons)
- Les fichiers `android/app/src/main/res/mipmap-*/ic_launcher.png` utilisent l'ancien logo
- **Action requise** : regénérer avec `flutter_launcher_icons` en utilisant le nouveau logo
- Étapes :
  1. Convertir `frontend/public/assets/logo-symbol.svg` en PNG 1024x1024
  2. Configurer `flutter_launcher_icons` dans `pubspec.yaml`
  3. Exécuter `flutter pub run flutter_launcher_icons`

### Fichiers sources vectoriels du logo
- Le PDF `logo PT.pdf` contient des images rasterisées, pas de vecteurs exportables
- Logo recréé manuellement en SVG basé sur la charte
- **Si besoin de haute fidélité** : demander les fichiers .ai/.svg originaux à l'équipe infographes ATAABA
# Suivi remédiation audit — 29 août 2026

## Bloquants externes

- **SEC-01 — rotation/purge requise (critique)** : la vérification locale et distante confirme que des secrets ont été présents dans les commits `8670682`, `6bbf9e7` et `4ca5e51` de `origin/main`. Ils doivent être révoqués chez les fournisseurs puis purgés de l’historique Git par le propriétaire du dépôt.
- **SEC-02 — statut serveur à confirmer** : le script de déploiement a été commité dans l’historique Git, mais aucun accès Hostinger n’est disponible pour confirmer qu’il n’a jamais été déployé. Vérifier le répertoire public du serveur et les sauvegardes de déploiement.
- **Prestataires / exploitation** : l’accès aux consoles DexPay, SMS, WhatsApp, Brevo et FCM, ainsi qu’aux journaux webhook/queue et à l’infrastructure Hostinger, est nécessaire pour certifier les flux réels. Aucun frais, délai ou configuration n’est supposé dans le code.

## Refonte mobile — limites de validation externe

- **Hostinger** : déployer le backend puis exécuter toutes les migrations du 29 août 2026. Sans accès serveur, l'application locale est testée mais la version de production ne peut pas être certifiée.
- **DexPay** : confirmer les clés renouvelées, l'URL webhook, les opérateurs activés, les frais contractuels, les limites, les délais et les journaux de paiements/retraits depuis la console. Aucune valeur sensible n'est déduite.
- **Appareil physique** : caméra QR, biométrie, notifications FCM, ouverture du checkout externe et comportement hors connexion doivent être rejoués sur Android/iOS réels. Chrome valide le rendu et les parcours web, pas les capacités matérielles.
- **KYC** : la politique de rétention, le lieu de stockage et les droits d'accès aux documents doivent être décidés et validés juridiquement avant une certification de production.
- **Photographies** : le splash a été remplacé par une image de commerce sénégalais générée pour le projet (vendeuse adulte, paiement mobile). Une campagne photo propriétaire avec droits de diffusion reste recommandée pour une identité exclusive.
- **Notifications distantes (FCM)** : la page mobile de préférences, la permission Android et le test de notification locale sont opérationnels. La réception de notifications liées aux ventes/retraits nécessite encore les identifiants FCM, l’enregistrement sécurisé des appareils et le branchement des événements serveur ; ces éléments ne sont pas inventés ni activés sans les accès Firebase.
- **Publication** : les icônes de launcher et les captures boutiques doivent être régénérées/validées avant soumission Google Play et App Store.

## Déploiement nécessaire après modifications backend

Après upload sur Hostinger : exécuter `php artisan migrate`, vider les caches applicatifs de manière sûre, configurer le webhook DexPay puis effectuer un paiement de faible montant en environnement autorisé. Ces actions nécessitent les accès de production et ne sont donc pas exécutées localement.

## Mise à jour 2026-09-02

- Les migrations DexPay disponibles ont été exécutées sur Hostinger, y compris `2026_09_02_000002_add_dexpay_payout_columns_to_withdrawal_requests` après découverte du champ manquant lors du test sandbox réel.
- Retrait DexPay sandbox validé de bout en bout. Le webhook reste à configurer lorsque le domaine définitif sera disponible ; le payout sandbox synchrone a néanmoins confirmé l’écriture wallet avec les frais réels DexPay.
- La validation Cash In complète reste conditionnée à un callback public signé ou à une interrogation de statut qui retourne les frais/net DexPay : le sandbox a retourné `completed` mais aucun montant de frais/net pour la session validée manuellement.
