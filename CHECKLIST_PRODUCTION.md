# PayTrack — Checklist Mise en Production

## Phase A — Sécurité du cœur (FAIT)
- [x] Policies créées: Client, Article, Sale, Payment, Shop, User
- [x] Middleware EnsureTenantAccess appliqué via alias route
- [x] Global scope BelongsToTenant sur tous modèles
- [x] Tests tenant isolation (6 tests)
- [x] Tests QR public sécurité (6 tests)
- [x] Tests double paiement (6 tests)
- [x] Tests rôles vendeur/client (2 tests)
- [x] Dashboard SQLite/MySQL compatible

## Phase B — Fonctions métier (FAIT)
- [x] ShopController (CRUD boutiques)
- [x] UserController (CRUD, activation, rôles, reset password)
- [x] ReceiptPdfService + templates (contrat vente, reçu paiement)
- [x] ExportController (CSV ventes, paiements, retards)
- [x] Routes API complètes

## Phase C — Web production (EN COURS)
- [x] Logo corrigé (import asset)
- [ ] Créer page admin boutiques
- [ ] Créer page admin utilisateurs
- [ ] Ajouter boutons téléchargement PDF/CSV
- [ ] Tests E2E Playwright parcours vendeur
- [ ] Tests E2E parcours client
- [ ] Tests E2E parcours admin

## Phase D — Mobile Flutter
- [ ] Remplacer mock_data.dart par API réelle
- [ ] Auth store + token management
- [ ] Écrans connectés: Dashboard, Clients, Ventes, Paiements
- [ ] Scanner QR vers API
- [ ] APK release signé

## Phase E — Intégrations externes
- [ ] Wave Business (clés fournies)
- [ ] Orange Money (clés fournies)
- [ ] Email Brevo (clés fournies)
- [ ] SMS Africa's Talking (clés fournies)
- [ ] Push FCM (projet Firebase)

## Phase F — Déploiement
- [ ] VPS Linux configuré
- [ ] Nginx + PHP-FPM + MySQL
- [ ] HTTPS certificat
- [ ] Domaine api.paytrack.sn / app.paytrack.sn
- [ ] Backup automatique
- [ ] CI/CD pipeline

---

## Comment tester

### 1. Backend (Laravel)
```bash
cd backend

# Migrations + seed
php artisan migrate:fresh --seed

# Tests automatisés (22 tests)
php artisan test

# Serveur dev
php artisan serve
```

### 2. Frontend (React)
```bash
cd frontend
npm run dev
```
Ouvrir http://localhost:5173

### 3. Comptes de test (après seed)
| Email | Password | Rôle |
|-------|----------|------|
| moussa@phoneshop-dakar.com | demo1234 | admin_entreprise |
| fatou@phoneshop-dakar.com | demo1234 | responsable_boutique |
| omar@phoneshop-dakar.com | demo1234 | vendeur |

### 4. Parcours à tester manuellement

**A. Login**
1. Aller sur /login
2. Entrer moussa@phoneshop-dakar.com / demo1234
3. ✓ Redirigé vers dashboard

**B. Dashboard vendeur**
1. KPIs affichés (encaissé, actives, retards, soldées)
2. Graphique encaissements
3. Liste retards
4. Échéances à venir

**C. Créer une vente**
1. Cliquer "Nouvelle vente"
2. Sélectionner client existant ou créer
3. Sélectionner article
4. Définir montant, acompte, tranches
5. ✓ Vente créée avec échéancier

**D. Enregistrer un paiement**
1. Ouvrir une vente active
2. Cliquer "Enregistrer paiement"
3. Saisir montant, mode (espèces/Wave)
4. ✓ Montants mis à jour

**E. Télécharger reçu PDF**
```bash
# Test direct API
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/sales/1/receipt -o contrat.pdf
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/payments/1/receipt -o recu.pdf
```

**F. Export CSV**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/exports/sales -o ventes.csv
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/exports/payments -o paiements.csv
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/exports/overdue -o retards.csv
```

**G. Test isolation tenant**
- Créer 2 users de tenants différents
- Vérifier qu'ils ne voient pas les données de l'autre

**H. Test QR public**
```bash
# Doit retourner nom masqué, pas de montants
curl http://localhost:8000/api/qr/UUID-DE-LA-VENTE
```

### 5. Tests automatisés backend
```bash
php artisan test --filter=TenantIsolation     # 6 tests
php artisan test --filter=QRPublicSecurity    # 6 tests
php artisan test --filter=PaymentDoubleSubmit # 6 tests
php artisan test --filter=PaymentFlowSecurity # 2 tests
```

### 6. Build production
```bash
# Frontend
cd frontend && npm run build

# Vérifier dist/
ls -la dist/
```
