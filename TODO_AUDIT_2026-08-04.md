# PayTrack Audit — 4 août 2026

## Résumé

API backend fonctionnelle sur Hostinger. 1 bug trouvé, 1 fix local à déployer.

---

## ✅ Endpoints testés OK

| Endpoint | Méthode | Status |
|----------|---------|--------|
| `/auth/login` | POST | ✅ |
| `/auth/register` | POST | ✅ |
| `/auth/logout` | POST | ✅ |
| `/auth/me` | GET | ✅ |
| `/otp/send` | POST | ✅ (email envoyé) |
| `/otp/verify` | POST | ✅ |
| `/dashboard/stats` | GET | ✅ |
| `/dashboard/activity` | GET | ✅ |
| `/dashboard/upcoming` | GET | ✅ |
| `/clients` | GET/POST | ✅ |
| `/clients/{id}` | GET/PUT/DELETE | ✅ |
| `/articles` | GET | ✅ |
| `/articles/{id}` | GET/PUT | ✅ |
| `/sales` | GET/POST | ✅ |
| `/sales/{id}` | GET | ✅ |
| `/sales/{id}/payments` | POST | ✅ |
| `/qr/{uuid}` | GET | ✅ (public, masqué) |
| `/shops` | GET/POST | ✅ |
| `/users` | GET/POST | ✅ |
| `/users/{id}/toggle-active` | POST | ✅ |
| `/admin/stats` | GET | ✅ |
| `/admin/reports` | GET | ✅ |
| `/admin/settings` | GET/PUT | ✅ |
| `/exports/sales` | GET | ✅ (CSV) |
| `/exports/payments` | GET | ✅ (CSV) |
| `/sales/{id}/receipt` | GET | ✅ (PDF) |

---

## ❌ Bug trouvé

### Article CREATE (500)

**Symptôme**: `POST /articles` retourne 500 Server Error

**Cause**: `ArticleController.php:44` ajoute `shop_id` mais la table `articles` n'a pas de colonne `shop_id`

**Fix local appliqué**:
```php
// Avant
$article = Article::create([...$validated, 'shop_id' => $request->user()->shop_id]);

// Après
$article = Article::create($validated);
```

**Fichier**: `backend/app/Http/Controllers/Api/ArticleController.php`

**Status**: ⚠️ Fix local, à déployer sur Hostinger

---

## ⏳ En attente de clés API

| Service | Variables .env requises |
|---------|------------------------|
| Wave | `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET` |
| Orange Money | `ORANGE_MONEY_CLIENT_ID`, `ORANGE_MONEY_CLIENT_SECRET`, `ORANGE_MONEY_MERCHANT_KEY` |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Apple OAuth | `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` |
| SMS (Africa's Talking) | `AFRICASTALKING_API_KEY` |
| Push (FCM) | `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_JSON` |

---

## 📱 Mobile Flutter

- ✅ `ApiService` pointe vers prod (`/backend/public/api`)
- ✅ Auth provider connecté à API réelle (pas de mock)
- ✅ Dashboard/Sales/Clients providers connectés
- ⚠️ APK `PayTrack-v1.2.apk` présent (68 Mo) — à tester sur device

---

## 🛠️ Actions requises

### Priorité 1 — Déployer le fix Article

```bash
# Option 1: Via SSH (si accès configuré)
scp -P 65002 backend/app/Http/Controllers/Api/ArticleController.php \
    u166382491@lightsalmon-eel-638395.hostingersite.com:/home/u166382491/public_html/backend/app/Http/Controllers/Api/

# Option 2: Via File Manager Hostinger
# Uploader ArticleController.php dans le bon dossier

# Option 3: Python script
python deploy_fix.py
```

### Priorité 2 — Tester APK mobile

1. Installer `PayTrack-v1.2.apk` sur Android
2. Login avec `moussa@phoneshop-dakar.com` / `demo1234`
3. Vérifier dashboard, liste clients, liste ventes

### Priorité 3 — Obtenir clés Wave

1. Aller sur https://business.wave.com
2. Settings → API Keys
3. Ajouter `WAVE_API_KEY` et `WAVE_WEBHOOK_SECRET` dans `.env` prod

---

## 📊 Données de test créées

- Sale VT-2026-0001 (iPhone 15 Pro, 850000 XOF, 4 tranches)
- Payment RC-4AIVYYAQ (187500 XOF sur tranche 1)
- Client "Nouveau Client Test" (+221779998877)
- User "Nouveau User" (nouveau@example.com) — tenant séparé

---

## URLs

- **Frontend**: https://lightsalmon-eel-638395.hostingersite.com/
- **API**: https://lightsalmon-eel-638395.hostingersite.com/backend/public/api
- **Laravel Welcome**: https://lightsalmon-eel-638395.hostingersite.com/backend/public/
