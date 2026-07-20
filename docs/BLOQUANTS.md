# PayTrack — Bloquants et services externes
*Mis à jour : 2026-07-06*

---

## ✅ Services confirmés — intégrés, en attente des clés

| Service | Statut | Numéro/Compte | Ce qu'il manque |
|---------|--------|---------------|-----------------|
| **Wave Business** | Actif chez ATAABA | 78 751 72 72 | `WAVE_API_KEY` + `WAVE_WEBHOOK_SECRET` depuis Wave Business Dashboard |
| **WhatsApp Business** | Actif chez ATAABA | 78 751 72 72 | `WHATSAPP_META_ACCESS_TOKEN` + `WHATSAPP_META_PHONE_ID` depuis Meta Developer Console |
| **Africa's Talking (SMS)** | À configurer | — | Créer compte africastalking.com → `AFRICASTALKING_USERNAME` + `AFRICASTALKING_API_KEY` |
| **Brevo (Email)** | À configurer | — | Créer compte brevo.com → `BREVO_API_KEY` |
| **Firebase FCM** | À créer | — | Créer projet Firebase → télécharger `firebase-service-account.json` |
| **Cloudflare R2** | À configurer | — | Créer bucket `paytrack-files` → `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_ENDPOINT` |

---

## 🟡 En attente (intégration prête, feature flag désactivé)

| Service | Statut | Action requise |
|---------|--------|----------------|
| **Orange Money** | Code marchand en cours de validation | Mettre `ORANGE_MONEY_ENABLED=true` dans `.env` + remplir les 4 variables OM quand reçu |

---

## ❌ Skip V1

| Service | Raison |
|---------|--------|
| **Free Money** | Pas prioritaire pour la V1 |
| **Twilio** | Remplacé par Africa's Talking (SMS) + Meta WhatsApp (WhatsApp) |

---

## 🔑 Comment obtenir les clés

### Wave Business (numéro ATAABA 78 751 72 72)
1. Aller sur business.wave.com
2. Se connecter avec le compte ATAABA
3. Settings → API Keys → Create New Key
4. Copier `WAVE_API_KEY` dans `.env`
5. Settings → Webhooks → Add endpoint : `https://api.paytrack.sn/api/webhooks/wave`
6. Copier le secret webhook → `WAVE_WEBHOOK_SECRET`

### WhatsApp Business Meta (numéro ATAABA 78 751 72 72)
1. developers.facebook.com → My Apps → PayTrack (ou créer)
2. WhatsApp → Getting Started → Add Phone Number → utiliser 78 751 72 72
3. System Users → Create System User → Generate Token → `WHATSAPP_META_ACCESS_TOKEN`
4. Phone Numbers → le numéro → Phone number ID → `WHATSAPP_META_PHONE_ID`
5. Configurer webhook : `https://api.paytrack.sn/api/webhooks/whatsapp`

### Africa's Talking (SMS)
1. Créer compte sur africastalking.com
2. Dashboard → API Key → Generate → `AFRICASTALKING_API_KEY`
3. Username = votre username AT → `AFRICASTALKING_USERNAME`
4. Demander l'approbation du Sender ID "PayTrack" (peut prendre 1-3 jours)
5. **En sandbox** : username=`sandbox`, tester sans coût

### Brevo (Email transactionnel)
1. Créer compte sur brevo.com
2. Mon compte → SMTP & API → API Keys → Créer une clé → `BREVO_API_KEY`
3. Vérifier le domaine d'envoi (SPF/DKIM) pour éviter le spam

### Firebase FCM
1. console.firebase.google.com → Créer un projet "paytrack-production"
2. Project Settings → Service accounts → Generate new private key
3. Télécharger le JSON → `FCM_SERVICE_ACCOUNT_JSON=/var/www/paytrack/firebase-service-account.json`
4. Copier `project_id` du JSON → `FCM_PROJECT_ID`

### Cloudflare R2
1. dash.cloudflare.com → R2 → Create bucket "paytrack-files"
2. R2 → Manage R2 API tokens → Create token (Object Read & Write)
3. Copier Access Key ID → `AWS_ACCESS_KEY_ID`
4. Copier Secret Access Key → `AWS_SECRET_ACCESS_KEY`
5. `AWS_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## 🖥️ Infrastructure VPS (Hostinger/DigitalOcean — 2 vCPU / 4 Go)

### Prérequis serveur
```bash
# PHP 8.2 + extensions
apt install php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml \
    php8.2-curl php8.2-gd php8.2-zip php8.2-intl php8.2-redis

# MySQL 8.0
apt install mysql-server

# Nginx
apt install nginx

# Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

# Supervisor (queue workers)
apt install supervisor
```

### Déploiement
```bash
cd /var/www/paytrack/backend
git pull
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan migrate --force
php artisan queue:restart
```

### Supervisor config `/etc/supervisor/conf.d/paytrack.conf`
```ini
[program:paytrack-worker]
command=php /var/www/paytrack/backend/artisan queue:work --sleep=3 --tries=3 --timeout=60
directory=/var/www/paytrack/backend
user=www-data
numprocs=2
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/paytrack-worker.log
```

### Cron `/etc/crontab`
```
* * * * * www-data php /var/www/paytrack/backend/artisan schedule:run >> /dev/null 2>&1
```

---

## ✅ Ce qui marche sans clés (mode démo)

- Interface web complète (12 pages React)
- Authentification mock (vendeur + client)
- Création de ventes, enregistrement de paiements
- QR Code généré côté client
- Dashboard avec graphes et données cohérentes
- App Flutter mobile (structure + UI complète)
- Wave actif dès que `WAVE_API_KEY` est fournie
