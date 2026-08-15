# PayTrack — Plan de mise en production

_État vérifié le 2 août 2026. Ce document remplace les anciens statuts optimistes : chaque point est fondé sur le code et les tests exécutés._

## 1. Décision produit

PayTrack V1 doit permettre à une entreprise sénégalaise de créer des clients et articles, vendre comptant ou par tranches, suivre les échéances, enregistrer les paiements, produire un reçu et informer le client. Les paiements Wave et Orange Money sont des intégrations de collecte sur le compte marchand de la boutique ; PayTrack ne prélève aucune commission.

Le périmètre de publication initiale est : web responsive + Android. iOS sera construit depuis le même projet Flutter, mais sa publication dépend d’un compte Apple Developer et d’un Mac/Xcode de signature.

## 2. État réel de départ

| Domaine | Vérifié | État |
|---|---|---|
| Backend Laravel | API, migrations, Sanctum et services externes présents | Partiellement fonctionnel ; contrôles d’accès et flux métier à compléter/tester |
| Web React | Build production réussi | Connecté à l’API, mais écrans et contrats API encore incohérents |
| Mobile Flutter | Android/iOS scaffold présents | Données et authentification mockées ; non publiable |
| Tests | `php artisan test` réussi | Couverture métier insuffisante ; pas d’E2E web/mobile |
| Déploiement | Aucun environnement de production vérifié | Bloqué par domaine, VPS et secrets |

## 3. Règles non négociables

1. Toute donnée métier est filtrée côté serveur par `tenant_id`; le frontend ne constitue jamais une frontière de sécurité.
2. Chaque route vérifie une Policy : client, article, vente, paiement, boutique, utilisateur et export.
3. Les montants sont des entiers XOF. Aucune valeur monétaire ne transite en flottant.
4. Un paiement validé est immuable. Une correction est une contre-écriture, auditée, jamais une suppression silencieuse.
5. Les identifiants personnels, pièces d’identité, tokens et clés ne sont jamais exposés au web, aux QR publics ou aux logs.
6. Chaque ajout métier arrive avec test API ; chaque parcours majeur arrive avec test E2E.

## 4. Plan d’exécution

### Phase A — Stabiliser le cœur sécurisé

**But.** S’assurer que l’API peut tenir le rôle de source de vérité avant d’y connecter tous les écrans.

| Travail | Comment | Pourquoi | Validation |
|---|---|---|---|
| Finaliser RBAC | Policies + middleware sur toutes les ressources | Empêcher accès client/vendeur hors périmètre | Tests 403/200 par rôle et tenant |
| Compléter isolation boutique | Filtrer vendeur/responsable par `shop_id`, admin entreprise par tenant | Une entreprise multi-boutiques ne doit pas mélanger les dossiers | Tests deux boutiques |
| Stabiliser ventes | Comptant, tranche, acompte, échéancier, fréquences personnalisées, stock transactionnel | Cœur du produit | Tests création, arrondis, rupture, concurrence |
| Stabiliser paiements | Affectation partielle/multi-échéances, annulation contrôlée, numéros de reçu uniques | Éviter solde erroné ou fraude interne | Tests de recalcul et double soumission |
| Rendre QR sûr | Public : résumé masqué. Connecté : Policy de lecture complète | Le QR ne doit pas divulguer données financières | Tests anonyme/client/vendeur/autre tenant |
| Réparer dashboard | Requêtes tenant/boutique cohérentes, statuts réels | Indicateurs fiables pour décisions | Fixtures + assertions KPI |

**Sortie de phase.** API testée : auth, clients, articles, vente comptant/tranche, paiement, QR, dashboard. Aucun endpoint métier autorisé au seul motif d’être connecté.

### Phase B — Fonctions métier manquantes

**But.** Atteindre le cahier des charges sans maquettage.

1. Gestion boutiques et utilisateurs : invitation, activation/désactivation, affectation boutique, rôles, réinitialisation mot de passe.
2. Gestion catalogue : recherche, activation, stock bas, mouvement de stock, service sans stock.
3. Échéancier : hebdomadaire, bimensuel, mensuel, trimestriel et intervalle personnalisé ; réaménagement autorisé avec motif et journal d’audit.
4. Paiements : espèces, Wave, Orange Money, virement, chèque ; référence externe ; preuve de paiement ; reçu PDF.
5. Rapports : CSV en priorité, PDF et Excel ensuite ; ventes, encaissements, retards, échéances, vendeur, boutique, méthode.
6. Audit et rétention : interface super-admin, export d’audit, archivage/anonymisation conforme à la politique documentée.

**Sortie de phase.** Aucun bouton d’un parcours commercial ne mène à une donnée simulée ou à une action locale non persistée.

### Phase C — Web production

**But.** Le web utilise uniquement l’API réelle et reste simple sur mobile.

| Travail | Comment | Pourquoi | Validation |
|---|---|---|---|
| Normaliser contrats API | Une ressource et ses champs sont identiques partout | Supprimer les écarts `name/full_name`, `schedule/schedules`, statuts | Tests composants + build |
| Erreurs et chargements | États réseau, validation 422, session expirée, pagination | Éviter pertes/silences utilisateur | Tests navigateur |
| Parcours vendeur | Client → article → vente → QR → paiement → reçu | Le parcours quotidien doit tenir en quelques actions | Playwright E2E |
| Parcours client | Connexion, ses seuls dossiers, échéances, reçus | Confidentialité et compréhension | Playwright E2E rôle client |
| Admin entreprise | Boutiques, utilisateurs, rapports, paramétrage | Rôle requis par le produit | Playwright E2E rôle admin |
| Accessibilité | Navigation clavier, contrastes, libellés, erreurs annoncées | Utilisation terrain et conformité de base | Audit WCAG ciblé |

Direction : conserver une interface sobre, à contraste élevé, lisible en plein soleil ; montants alignés et actions commerciales clairement distinctes des actions destructrices.

### Phase D — Mobile Flutter réel

**But.** Retirer tous les mocks et offrir le même accès métier que le web.

1. Ajouter client HTTP, configuration d’URL par environnement, intercepteur token, renouvellement/expiration session.
2. Remplacer `mock_data.dart` dans chaque écran par repositories/API et états Riverpod asynchrones.
3. Ajouter création client, vente, enregistrement paiement et téléchargement/partage reçu.
4. Faire scanner QR vers l’URL ou UUID API réel.
5. Ajouter synchronisation hors ligne limitée : lecture cache, file d’attente chiffrée des paiements, idempotency key, résolution de conflit serveur.
6. Configurer Firebase Android/iOS, token appareil, permissions, notification de rappel.
7. Remplacer applicationId `com.example.paytrack_mobile`, icônes, signature release et politique confidentialité.

**Sortie de phase.** APK Android release installable, connecté à une API de préproduction, parcours vendeur/client E2E réussi. Archive iOS validée lorsque compte Apple et Mac sont disponibles.

### Phase E — Notifications, reçus et paiements externes

**But.** Activer les intégrations seulement après secrets et validations fournisseur.

| Service | Choix | Préparation code | Précondition |
|---|---|---|---|
| Email | Brevo | SMTP/API et modèles présents ; PDF à rattacher | Domaine SPF/DKIM + clé |
| SMS | Africa’s Talking | Service présent | Compte, clé et Sender ID approuvé |
| WhatsApp | Meta Cloud API | Service présent | Numéro vérifié, token permanent, templates approuvés |
| Push | Firebase FCM | Service backend présent | Projet Firebase + fichiers Android/iOS + compte de service |
| Wave | Wave Business | Gateway/webhook présents, à valider contre doc fournisseur | Clé API, secret webhook, sandbox/merchant |
| Orange Money | Orange Money Sénégal | Gateway feature-flagguée | Contrat, Merchant Key, OAuth, URL production |
| Fichiers | Cloudflare R2 | S3 compatible configuré | Bucket privé et clés limitées |

Pour chaque passerelle : test sandbox, signature webhook, idempotence, rejouabilité, journal d’audit, alerte d’échec. Aucun secret ne sera commité.

### Phase F — Production et exploitation

1. Environnements distincts : local, préproduction, production ; bases et clés séparées.
2. VPS Linux : Nginx, PHP 8.2+, MySQL 8, Redis recommandé, Supervisor queue, cron Laravel.
3. HTTPS : `api.paytrack.sn` et `app.paytrack.sn`, CORS limité aux domaines réels.
4. Sauvegardes : MySQL quotidienne chiffrée, rétention 30 jours, restauration testée mensuellement.
5. Observabilité : logs structurés sans données sensibles, alertes erreurs queue/webhook, healthcheck, disponibilité.
6. CI : tests backend, build web, analyse/test Flutter, audit dépendances, migration de préproduction avant production.
7. Légal : CGU, confidentialité, politique données/retention, procédure support et incident.

**Sortie de phase.** Déploiement reproductible, sauvegarde restaurée avec succès, E2E préproduction, check-list sécurité signée, pilote avec une boutique.

## 5. Tests de recette obligatoires

1. Inscription entreprise crée tenant, boutique, administrateur et session.
2. Vendeur crée client, article, vente tranche et QR ; stock est réduit une fois.
3. Client connecté ne voit que ses ventes et reçus.
4. QR anonyme ne révèle ni téléphone, ni montant, ni historique.
5. Paiement partiel met à jour montant payé, reste, échéance et audit.
6. Double requête de paiement ne double pas l’encaissement.
7. Autre tenant et autre boutique ne peuvent lire ou modifier la vente.
8. Vente comptant est soldée immédiatement et a un reçu.
9. Relance échouée est journalisée et réessayée sans envoyer deux fois.
10. Web, Android et API fonctionnent sur préproduction HTTPS.

## 6. Dépendances qui exigent une action propriétaire

- Domaine, VPS et accès SSH : indispensables au lancement public.
- Compte Wave Business et clés webhook : indispensables pour encaissement Wave intégré.
- Contrat/clé Orange Money : indispensables pour Orange Money intégré.
- Compte Google Play : frais uniques obligatoires pour publier Android.
- Compte Apple Developer et Mac/Xcode : indispensables pour publier iOS.
- Comptes Brevo, Africa’s Talking, Meta, Firebase et Cloudflare : peuvent démarrer sur leurs paliers gratuits/sandbox, mais nécessitent les comptes du propriétaire.

## 7. Ordre immédiat

1. Finir les tests et règles API de la phase A.
2. Corriger les écarts web/API et couvrir le parcours vendeur par E2E.
3. Construire gestion utilisateurs/boutiques, reçus et exports.
4. Remplacer les mocks Flutter par l’API.
5. Mettre en préproduction puis brancher services externes avec les identifiants fournis.

## 8. Définition de « prêt marché »

PayTrack ne sera déclaré prêt marché que lorsque le parcours vendeur et client est vérifié sur préproduction avec une base réelle, les autorisations multi-tenant sont couvertes par tests, Android release est signé, les sauvegardes sont restaurables, le domaine HTTPS fonctionne, et chaque intégration activée a passé son test fournisseur. Les fonctionnalités dépendantes de clés absentes resteront explicitement désactivées, jamais simulées.
