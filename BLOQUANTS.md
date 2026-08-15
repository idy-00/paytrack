# PayTrack — Blockers / Questions

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

### Bloquants PayTech (Cash In)

1. **Clés API PayTech** — nécessaires pour activer les paiements en ligne
   - Variables .env requises : `PAYTECH_API_KEY`, `PAYTECH_API_SECRET`
   - Obtenir depuis : dashboard PayTech → Mes applications → Détails
   - Mode actuel : sandbox/mock (logique de sécurité en place, non testable sans clés)

3. **Whitelist IP PayTech** (optionnel mais recommandé)
   - Si PayTech fournit une liste d'IPs pour les webhooks, la configurer sur le serveur
   - Actuellement : vérification de signature HMAC seule (suffisant mais IP whitelist = bonus)

### Bloquants existants (rappel)

1. **VPS + domaine custom** — api.paytrack.sn / app.paytrack.sn pas encore configurés
   - Actuellement sur : lightsalmon-eel-638395.hostingersite.com

2. **Clés Wave Business API** — KYC en cours (2-4 semaines estimées)
   - Variables : `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET`

3. **Clés Orange Money API** — contrat en cours (3-6 semaines estimées)
   - Variables : `ORANGE_MONEY_CLIENT_ID`, `ORANGE_MONEY_CLIENT_SECRET`, `ORANGE_MONEY_MERCHANT_KEY`

4. **Compte Google Play** — frais uniques pour publier l'APK Android

### Non bloquant — Travail en attente de clés

- Webhook PayTech : endpoint prêt `/api/webhooks/paytech`, sécurité HMAC en place
- Paiements Wave/Orange via PayTech : code prêt, feature-flagué
- Notifications email abonnement : Brevo configuré, templates à créer

---

## 2026-08-09 — Mise à jour vérification

### Prêt à tester dès clés PayTech disponibles
- `PaytechService.isConfigured()` retourne false si clés manquantes → graceful degradation
- UI affiche "Paiement en ligne non disponible" si PayTech non configuré
- Tout le code métier (wallet, orders, subscriptions) fonctionne sans clés (mode manuel)

### Question INTECH GROUP (rappel)
- API de reversement/payout vers Wave/Orange Money du marchand existe-t-elle ?
- Si non : retraits traités manuellement via dashboard ATAABA (déjà implémenté)
