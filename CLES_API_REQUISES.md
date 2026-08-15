# PayTrack - Clés API Requises pour Production

## Résumé Exécutif

PayTrack est prêt à passer en production. Toutes les fonctionnalités core sont implémentées et testées :
- Authentification sécurisée (Laravel Sanctum)
- Gestion multi-tenant avec isolation des données
- Ventes à crédit avec échéancier automatique
- Paiements manuels et mobile money
- QR code public avec données masquées
- Exports CSV et PDF
- Tests automatisés (22 tests passent)

**Pour activer toutes les fonctionnalités, nous avons besoin des clés API suivantes.**

---

## 1. Paiements Mobile Money (OBLIGATOIRE pour encaissement)

### Wave Sénégal
**Contact :** https://wave.com/en/business ou partenaires@wave.com
**Délai estimé :** 2-4 semaines (KYC entreprise requis)

Clés à obtenir :
```
WAVE_API_KEY=xxx
WAVE_API_SECRET=xxx
WAVE_WEBHOOK_SECRET=xxx
WAVE_BUSINESS_ID=xxx
```

**Documents requis :**
- NINEA de l'entreprise
- Registre de commerce
- Pièce d'identité du gérant
- Relevé bancaire (3 derniers mois)

---

### Orange Money Sénégal
**Contact :** https://developer.orange.com/apis/om-webpay ou orange-money-dev@orange.com
**Délai estimé :** 3-6 semaines

Clés à obtenir :
```
ORANGE_MONEY_API_KEY=xxx
ORANGE_MONEY_API_SECRET=xxx
ORANGE_MONEY_MERCHANT_KEY=xxx
ORANGE_MONEY_WEBHOOK_SECRET=xxx
```

**Documents requis :**
- Convention de partenariat signée
- Intégration technique validée
- Tests sandbox obligatoires

---

### Free Money (Optionnel)
**Contact :** Via Free Sénégal - marchands@free.sn
**Délai estimé :** 2-4 semaines

Clés à obtenir :
```
FREE_MONEY_API_KEY=xxx
FREE_MONEY_SECRET_KEY=xxx
FREE_MONEY_WEBHOOK_SECRET=xxx
```

---

## 2. Authentification Sociale (OPTIONNEL mais recommandé)

### Google Sign-In
**URL :** https://console.cloud.google.com
**Délai :** Immédiat (self-service)
**Coût :** Gratuit

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://paytrack.votredomaine.com/api/auth/google/callback
```

**Étapes :**
1. Créer un projet dans Google Cloud Console
2. Activer "Google+ API" ou "Google Identity"
3. Créer des identifiants OAuth 2.0
4. Ajouter les URI de redirection autorisés

---

### Apple Sign-In
**URL :** https://developer.apple.com
**Délai :** 1-2 jours (review Apple)
**Coût :** Programme développeur Apple requis (99$/an)

```
APPLE_CLIENT_ID=com.votreentreprise.paytrack
APPLE_TEAM_ID=xxx
APPLE_KEY_ID=xxx
APPLE_PRIVATE_KEY=xxx (fichier .p8)
```

---

## 3. Notifications (RECOMMANDÉ)

### Email - SMTP ou Service
**Options recommandées :**
- **Brevo (ex-Sendinblue)** - Gratuit jusqu'à 300 emails/jour
- **Mailgun** - 5000 emails/mois gratuits
- **AWS SES** - $0.10 pour 1000 emails

```
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=xxx
MAIL_PASSWORD=xxx
MAIL_FROM_ADDRESS=noreply@votredomaine.com
```

---

### SMS (Optionnel)
**Options Sénégal :**
- **Twilio** - $0.05/SMS international
- **Orange SMS API** - Tarifs locaux avantageux
- **Infobip** - Présence locale

```
TWILIO_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+221xxxxxxxx
```

---

### Push Notifications (Mobile)
**Service :** Firebase Cloud Messaging (FCM)
**URL :** https://console.firebase.google.com
**Coût :** Gratuit (illimité)

```
FCM_SERVER_KEY=xxx
FCM_SENDER_ID=xxx
```

---

## 4. Hébergement Production

### Serveur Backend
**Recommandation :** VPS avec PHP 8.2+, MySQL 8, SSL
- **DigitalOcean** - $12/mois (2GB RAM)
- **Hostinger VPS** - $9/mois
- **AWS Lightsail** - $10/mois

### Base de données
Production utilise MySQL (pas SQLite comme en dev).
```
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=paytrack_prod
DB_USERNAME=paytrack_user
DB_PASSWORD=xxx
```

### SSL/HTTPS
**Obligatoire** pour les paiements et l'authentification.
- Let's Encrypt (gratuit)
- Cloudflare (gratuit + CDN)

---

## Tableau Récapitulatif

| Service | Priorité | Délai | Coût |
|---------|----------|-------|------|
| Wave API | **HAUTE** | 2-4 sem | Commission ~1% |
| Orange Money API | **HAUTE** | 3-6 sem | Commission ~1-2% |
| Google OAuth | Moyenne | Immédiat | Gratuit |
| Apple OAuth | Basse | 2 jours | 99$/an |
| Email (Brevo) | Moyenne | Immédiat | Gratuit |
| SMS | Basse | 1 jour | ~$0.05/SMS |
| FCM Push | Moyenne | Immédiat | Gratuit |
| SSL | **HAUTE** | Immédiat | Gratuit |

---

## Prochaines Étapes

1. **Immédiat (cette semaine)**
   - Demander les comptes développeur Wave et Orange Money
   - Créer projet Google Cloud pour OAuth

2. **Court terme (2 semaines)**
   - Configurer environnement de staging
   - Tests sandbox mobile money

3. **Moyen terme (1 mois)**
   - Validation KYC mobile money
   - Mise en production

---

## Contact Technique

Pour toute question technique sur l'intégration :
- Les endpoints webhook sont prêts : `/api/webhooks/wave`, `/api/webhooks/orange-money`
- La documentation API est disponible sur demande
- Les tests d'intégration peuvent être lancés dès réception des clés sandbox

---

*Document généré le 2 août 2026*
*PayTrack v1.0 - Backend Laravel + Frontend React + Mobile Flutter*
