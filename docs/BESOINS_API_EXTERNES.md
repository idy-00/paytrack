# PayTrack — Besoins en services externes
**Document de recueil des prérequis techniques — à soumettre au responsable technique / patron**

*Objet : Identifier les services tiers nécessaires au fonctionnement de l'application PayTrack avant le déploiement en production.*

---

## 1. Paiements mobiles

### 1.1 Collecte de paiements Wave
**Besoin :** Permettre aux clients de payer une tranche directement via Wave Senegal depuis l'application.

Questions à poser :
- Avez-vous un compte marchand Wave Senegal actif (Wave Business) ?
- Si oui, avez-vous accès aux clés API Wave (tableau de bord Wave Business → Paramètres → API) ?
- Avez-vous un accès à l'environnement de test/sandbox Wave ?
- Quel est votre identifiant marchand Wave ?

---

### 1.2 Collecte de paiements Orange Money
**Besoin :** Permettre aux clients de payer une tranche via Orange Money Senegal.

Questions à poser :
- Avez-vous un compte marchand Orange Money Senegal actif ?
- Avez-vous un accès au portail développeur Orange (developer.orange.com) avec une application créée pour ce projet ?
- Disposez-vous d'un **Merchant Key** (clé marchand fournie par Orange Senegal aux partenaires commerciaux) ?
- Avez-vous les identifiants OAuth2 associés (Client ID et Client Secret) ?
- Avez-vous un contrat partenaire avec Orange Senegal pour l'utilisation de l'API de paiement web ?

---

### 1.3 Collecte de paiements Free Money (Free SN)
**Besoin :** Permettre aux clients de payer via Free Money (Free SN).

Questions à poser :
- Avez-vous un accord commercial avec Free SN pour l'intégration de leur API de paiement marchand ?
- Si oui, disposez-vous d'une clé API, d'un secret et d'un code marchand ?
- Ont-ils fourni une URL de sandbox/test ?
- Disposez-vous d'une documentation technique de leur API ?

---

## 2. Notifications

### 2.1 Envoi de SMS
**Besoin :** Envoyer des SMS aux clients pour confirmer un paiement, rappeler une échéance ou signaler un retard.

Questions à poser :
- Avez-vous un contrat avec un opérateur SMS professionnel (agrégateur SMS) ?
  - Si oui, lequel ? (exemples courants : Twilio, Africa's Talking, infobip, SMSsending.sn, OrangeSMS, etc.)
  - Disposez-vous d'un identifiant d'expéditeur (sender ID) personnalisé ? (ex : "PAYTRACK" affiché comme expéditeur)
  - Avez-vous un crédit SMS prépayé ou un abonnement actif ?
- Si vous n'avez pas encore de prestataire, lequel utilisez-vous dans vos autres projets ?

---

### 2.2 Notifications WhatsApp Business
**Besoin :** Envoyer des messages WhatsApp aux clients pour les confirmations et rappels (alternatif ou complémentaire aux SMS).

Questions à poser :
- Avez-vous un compte WhatsApp Business API actif ?
  - Si oui, passe-t-il par Meta directement (Meta Cloud API) ou par un partenaire (BSP) ?
  - Si partenaire, lequel ? (Twilio, Vonage, infobip, MessageBird, etc.)
  - Avez-vous un numéro WhatsApp Business vérifié ?
  - Vos templates de messages sont-ils déjà soumis et approuvés par Meta ?
- Si non encore activé : est-ce une priorité pour la V1 ou peut-on commencer avec les SMS uniquement ?

---

### 2.3 Envoi d'emails transactionnels (reçus, résumés)
**Besoin :** Envoyer par email les reçus de paiement en PDF et les résumés hebdomadaires aux vendeurs et administrateurs.

Questions à poser :
- Avez-vous un prestataire d'email transactionnel ?
  - Si oui, lequel ? (exemples : Mailgun, SendGrid, Brevo/Sendinblue, Amazon SES, Postmark)
  - Disposez-vous d'une clé API et d'un domaine d'envoi vérifié (ex : mg.votredomaine.com) ?
- Avez-vous un nom de domaine validé (enregistrements SPF/DKIM configurés) pour éviter que les emails tombent en spam ?
- Quelle adresse souhaitez-vous utiliser comme expéditeur ? (ex : noreply@paytrack.sn)

---

## 3. Notifications push mobiles (application Flutter)

### 3.1 Firebase Cloud Messaging (FCM)
**Besoin :** Envoyer des notifications push sur les téléphones Android (et iOS à terme) des vendeurs et clients via l'application mobile PayTrack.

Questions à poser :
- Avez-vous un projet Firebase créé pour cette application ?
  - Si oui, avez-vous accès à la console Firebase (console.firebase.google.com) ?
  - Avez-vous le fichier `google-services.json` (Android) déjà intégré dans le code Flutter ?
  - Avez-vous un compte de service (Service Account) avec les droits Firebase Cloud Messaging ?
- Si non, pouvez-vous créer un projet Firebase et nous transmettre le fichier de credentials du compte de service ?

---

## 4. Stockage de fichiers

### 4.1 Stockage cloud pour QR codes, reçus PDF et photos de pièces d'identité
**Besoin :** Stocker de manière sécurisée les fichiers générés par l'application (QR codes PNG, reçus PDF, documents d'identité clients chiffrés).

Questions à poser :
- Avez-vous un accès à un service de stockage objet compatible S3 ?
  - Si oui, lequel ? (exemples : AWS S3, Cloudflare R2, DigitalOcean Spaces, Backblaze B2, OVH Object Storage)
  - Disposez-vous d'une clé d'accès (Access Key ID + Secret Access Key) et d'un bucket créé ?
  - Quel est l'identifiant du bucket et la région/endpoint ?
- Si vous hébergez déjà sur un VPS Hostinger : préférez-vous stocker les fichiers localement sur le serveur ou utiliser un stockage cloud externe ?
- Pour les documents d'identité clients (données sensibles) : avez-vous une exigence de chiffrement spécifique ou de localisation des données (données stockées en Afrique ou en Europe) ?

---

## 5. Infrastructure serveur

### 5.1 Serveur backend (API Laravel)
**Besoin :** Héberger l'API backend PHP/Laravel accessible depuis l'application web et mobile.

Questions à poser :
- Avez-vous déjà un hébergement VPS ou serveur dédié actif ?
  - Si oui, quel prestataire ? Quelle configuration (RAM, CPU, OS) ?
  - PHP 8.2 est-il installé ? MySQL 8 est-il disponible ?
  - Pouvez-vous configurer des tâches planifiées (cron jobs) sur ce serveur ?
  - Pouvez-vous exécuter des workers de queue en arrière-plan (processus persistant) ?
- Avez-vous un nom de domaine disponible pour l'API ? (ex : api.paytrack.sn)
- Le certificat SSL (HTTPS) est-il géré automatiquement (Let's Encrypt) ou faut-il le configurer manuellement ?

### 5.2 Frontend web (React)
**Besoin :** Héberger l'interface web accessible aux vendeurs et administrateurs.

Questions à poser :
- Avez-vous un accès à Cloudflare Pages, Netlify ou Vercel pour le déploiement du frontend ?
  - Si non, le frontend peut être hébergé sur le même VPS que le backend.
- Avez-vous un sous-domaine disponible ? (ex : app.paytrack.sn)

---

## 6. Récapitulatif des informations à fournir

| Service | Ce dont nous avons besoin | Priorité |
|---|---|---|
| Wave Business API | Clé API + secret webhook | Obligatoire V1 |
| Orange Money API | Client ID + Client Secret + Merchant Key | Obligatoire V1 |
| Free Money API | Clé API + secret + code marchand | Optionnel V1 |
| SMS professionnel | Clé API fournisseur + sender ID | Obligatoire V1 |
| Email transactionnel | Clé API + domaine vérifié | Obligatoire V1 |
| WhatsApp Business | Token Meta ou credentials partenaire BSP | Optionnel V1 |
| Firebase FCM | Project ID + fichier Service Account JSON | Obligatoire V1 (mobile) |
| Stockage cloud (S3/R2) | Access Key ID + Secret + nom du bucket + endpoint | Obligatoire V1 |
| Serveur backend | Accès SSH + détails hébergement + domaine API | Obligatoire avant déploiement |
| Frontend | Domaine + accès Cloudflare Pages (ou VPS) | Obligatoire avant déploiement |

---

*Document préparé par l'équipe technique PayTrack — Version 1.0 — Juillet 2026*
*À compléter et retourner avant le début du déploiement en production.*
