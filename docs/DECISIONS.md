# PayTrack — Décisions techniques et visuelles

> Document vivant. Chaque choix important est justifié ici pour pouvoir être expliqué, défendu ou modifié consciemment.

---

## 1. Identité visuelle

### Direction artistique : "Registre de confiance"

**Inspiration :** Les meilleurs outils fintech africains (Wave, Orange Money) mettent le montant en héros absolu.
Les outils de productivité (Linear, Stripe Dashboard) montrent qu'une interface dense peut être élégante.
PayTrack fusionne les deux : la clarté d'un relevé de compte, la chaleur d'un commerçant de confiance.

**Ce qu'on évite absolument :**
- Dégradé violet/bleu sur fond blanc (cliché IA 2024)
- Bootstrap/Tailwind defaults (slate-500, blue-600, green-500 = invisible)
- Inter/Roboto/Arial = fonts sans caractère
- Icônes émoji dans l'interface

---

### 1.1 Palette de couleurs

| Rôle | Nom | Hex | Justification |
|------|-----|-----|---------------|
| Primaire UI | Ardoise Profonde | `#1A2332` | Bleu-marine quasi-noir, comme l'encre d'un contrat. Confiance absolue. Contrast ratio sur fond clair : ~14:1 (AAA). |
| Accent / Actions | Saphir Franc | `#1B5FA8` | Bleu distinctif — ni Bootstrap (#007bff), ni Tailwind (#2563eb). Chaud et saturé. Sur fond blanc : 5.1:1 (AA ✓). |
| Succès / Paiement | Vert Savane | `#1C7A52` | Vert terrien, pas le green-500 fluo. Évoque les billets CFA, la validation. Sur fond blanc : 5.4:1 (AA ✓). |
| Alerte / Retard | Ocre Sahel | `#B86A10` | Ocre chaud africain, pas d'orange générique. Pour badges : fond `#FEF3CD`, texte `#92580C` (7.2:1 ✓). |
| Danger / Litige | Bordeaux | `#8E2323` | Rouge profond, pas criard. Pour badges : fond `#FAE2E2`, texte `#7A1F1F`. |
| Neutre / Archivé | Gris Ardoise | `#5A6A7A` | Pour statuts inactifs, textes secondaires. |
| Fond principal | Blanc Chaud | `#FAFAF8` | Légèrement crème — réduit la fatigue oculaire en plein soleil de Dakar. |
| Surface carte | Sable Clair | `#F2EFE9` | Différencie les cartes du fond sans ombre lourde. |
| Texte principal | Ardoise Profonde | `#1A2332` | Voir ci-dessus. |
| Texte secondaire | Gris Moyen | `#4A5668` | Sur `#FAFAF8` : 7.1:1 (AA ✓). |
| Bordure | Gris Doux | `#E2DDD6` | Subtil, cohérent avec palette chaude. |

**Badges de statut** (fond teinté + texte sombre = meilleur contraste et lecture):
- `actif` → bg `#DBEAFE` text `#1A3A6E`
- `paye` → bg `#D1FAE5` text `#0D5E3A`
- `retard` → bg `#FEF3CD` text `#92580C`
- `litige` → bg `#FAE2E2` text `#7A1F1F`
- `solde` → bg `#E2E8F0` text `#2D3A4A`
- `en_attente` → bg `#F0EDEA` text `#4A5668`

---

### 1.2 Typographie

**Principe :** Les montants monétaires sont sacrés. Ils doivent être parfaitement alignés en colonne et immédiatement lisibles.

| Rôle | Police | Justification |
|------|--------|---------------|
| Brand / Titres principaux | **Fraunces** (variable) | Serif expressif avec old-style figures. Donne un caractère "document de confiance", inattendu dans le fintech. Signature visuelle de PayTrack. |
| Interface / Corps | **Outfit** | Géométrique humaniste. Excellent rendu mobile. Clairement distinct de Inter/Roboto. Supporte `font-variant-numeric: tabular-nums`. |
| Montants / Données | **Outfit** + `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1` | Chaque chiffre a la même largeur → les colonnes s'alignent parfaitement. Ex: `1 234 500 FCFA` vs `987 000 FCFA` s'alignent. |

**Échelle typographique :**
- `xs`: 11px / `sm`: 13px / `base`: 15px / `md`: 17px / `lg`: 20px / `xl`: 24px / `2xl`: 30px / `3xl`: 38px / `4xl`: 48px

---

### 1.3 Iconographie

**Set unique : Lucide React** (stroke 1.5px, coins arrondis cohérents).
- Jamais de mélange avec Heroicons, Material Icons, FontAwesome.
- Taille standard : 16px (inline), 20px (boutons), 24px (navigation), 32px (titres de section).

---

### 1.4 Espacement et grille

- Base : 4px (0.25rem)
- Multiples : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- Border radius : `sm`=4px, `md`=8px, `lg`=12px, `xl`=16px, `2xl`=24px
- Cartes : padding 20px desktop, 16px mobile
- Touch targets minimum : 44px height (Apple HIG)

---

## 2. Stack technique

### 2.1 Frontend

| Choix | Alternative rejetée | Raison |
|-------|--------------------|----|
| **React + Vite** | Next.js | Pas besoin de SSR pour la démo. Vite = DX optimal, cohérent avec ikdev.tech. |
| **Tailwind CSS v3** | CSS Modules, Styled-components | Tokens custom + utilitaires = vitesse sans sacrifice. v3 pour l'écosystème stable. |
| **React Router v6** | TanStack Router | Familier, stable, suffisant. |
| **Zustand** | Redux, Jotai | Minimal, sans boilerplate, parfait pour auth + UI state. |
| **TanStack Query v5** | SWR, Apollo | Standard pour async state management + caching. |
| **Lucide React** | Heroicons, Phosphor | Stroke consistent, tree-shakeable. |
| **qrcode.react** | qrcode.js | API React native, génération côté client du QR. |
| **react-pdf/renderer** | jsPDF | Génération PDF propre avec composants React. |

### 2.2 Backend

| Choix | Alternative rejetée | Raison |
|-------|--------------------|----|
| **Laravel 11** | Node.js/Express, Symfony | Écosystème riche (Sanctum, Eloquent, queues, policies). Familier dans l'équipe. |
| **Laravel Sanctum** | Passport (OAuth2) | Sanctum = tokens API + sessions SPA. Suffisant sans la complexité OAuth pour V1. |
| **MySQL 8** | PostgreSQL | Compatible Hostinger. Row-level security via `tenant_id` sur toutes les tables. |
| **Spatie Laravel Permission** | Rôles manuels | Package battle-tested pour RBAC, policy-based. |
| **Spatie Laravel Activitylog** | Table audit manuelle | Audit trail automatique sur tous les modèles critiques, append-only par design. |

### 2.3 Déploiement

| Composant | Hébergement | Raison |
|-----------|-------------|--------|
| Frontend | **Cloudflare Pages** | CDN global, gratuit, déploiement automatique depuis Git. |
| Backend API | **Hostinger VPS** ou **Railway** | Familier (déjà utilisé pour DelivApp), PHP + MySQL. |
| Stockage fichiers | **Cloudflare R2** ou local chiffré | R2 = S3-compatible, gratuit en ingress, chiffré au repos. |
| HTTPS | **Cloudflare SSL** | Automatique, obligatoire. |

---

## 3. Architecture multi-tenant

**Stratégie choisie : `tenant_id` sur toutes les tables (shared schema)**

**Alternatives considérées :**
- Schémas séparés par tenant → complexité migrations, difficile sur Hostinger mutualisé.
- Bases séparées → encore plus coûteux, surcharge opérationnelle.

**Implémentation :**
- Toutes les tables métier ont `tenant_id BIGINT NOT NULL INDEX`.
- Un `TenantScope` Eloquent global s'injecte automatiquement sur tous les modèles → impossible d'oublier.
- Les routes API utilisent un middleware `EnsureTenantAccess` qui valide que l'utilisateur authentifié appartient au tenant de la ressource demandée.
- Les super admins contournent ce scope via un flag dédié (jamais via `tenant_id = null`).

---

## 4. Sécurité

### 4.1 Authentification
- Mots de passe : `bcrypt` (cost factor 12 minimum).
- Sessions : Laravel Sanctum tokens (rotation automatique, expiration configurable).
- Inactivité : token invalide après 2h sans activité (configurable par rôle).
- MFA : prévu dès V1 pour les rôles `admin_entreprise` et `super_admin` via TOTP (Laravel Fortify).

### 4.2 QR Code
- Le QR Code contient uniquement un `UUID` opaque lié au dossier de paiement (pas de données sensibles dans l'URL).
- **Sans authentification** : affichage de la référence dossier, nom partiellement masqué (ex: "Ama***"), statut général, invitation à se connecter.
- **Avec authentification** : dossier complet selon rôle (vendeur = tout, client = son dossier uniquement).

### 4.3 Rétention des données
- Données actives : pendant la durée du contrat client.
- Archivage sécurisé : 5 ans après clôture (flag `archived_at`, table séparée après 1 an).
- Suppression/anonymisation : cron job `data:cleanup` vérifie les dossiers > 5 ans archivés et anonymise.
- Mis en place dès la V1 : table `data_retention_policies` par tenant + job planifié.

### 4.4 RBAC — 5 rôles
| Rôle | Périmètre |
|------|-----------|
| `super_admin` | Accès total toutes entreprises |
| `admin_entreprise` | Gestion de son entreprise : boutiques, utilisateurs, rapports |
| `responsable_boutique` | Gestion d'une boutique : vendeurs, ventes, clients |
| `vendeur` | Créer clients, ventes, enregistrer paiements |
| `client` | Voir ses propres dossiers uniquement |

Chaque endpoint vérifie les droits via `Policy` Laravel, pas seulement côté UI.

### 4.5 Journal d'audit
- Spatie ActivityLog sur : `Payment`, `Sale`, `Sale` (modification), `User` (connexion/déconnexion), `Schedule` (réaménagement).
- Logs append-only : pas de `UPDATE` ni `DELETE` sur `activity_log`. Seul `super_admin` peut archiver (pas supprimer).

---

## 5. Compromis démo vs production

| Point | Démo (semaine 2) | Production |
|-------|-----------------|------------|
| Mock data | Frontend mock data JSON | API Laravel réelle |
| MFA | Désactivé (flag `DISABLE_MFA=true`) | Activé pour admin+ |
| SMS/WhatsApp | Non implémenté | Twilio / Infobip |
| Mode hors-ligne | Non | Service Worker + IndexedDB |
| Export PDF reçus | Implémenté (react-pdf) | Même système |
| QR Code | Généré côté client | Généré + stocké côté serveur |
| Chiffrement photos pièce d'identité | Structure prévue, non activée | AES-256 + clé séparée |

---

*Dernière mise à jour : 2026-07-03*

---

## Itération 3 — Refonte design (2026-07-03)

### Direction artistique : Acajou & Or
The current PayTrack reads like a well-executed AI template: DM Serif Display + Outfit + corporate sapphire blue is the most common fintech-app-in-2024 combination in existence. The login dark-header split, the 2x2 KPI grid, the border-only white cards — each decision is defensible, but together they produce an app that looks like it was generated from the same GitHub repo as fifty others. The radical rethink: PayTrack is not a bank app, not a telecom product, not a Silicon Valley SaaS. It is a digital grand registre for Sénégalais commerçants — the living version of the physical carnet that every boutique owner keeps. The direction draws from three hyper-specific visual references from the Sénégalais merchant context: (1) the warm deep mahogany of hardwood furniture from Thiès workshops, the color of a serious merchant's desk — not generic navy, not startup blue; (2) the specific amber-gold of West African 18k jewelry, the color of FCFA metal, of value itself; (3) the cream of quality vergé paper — not sterile white, but the aged cream of a register that has been used and trusted. The typographic system breaks completely from the DM Serif template by introducing Fraunces (a 2020 optical-size variable serif with ink-trap character that reads as hand-pressed type — unused in African fintech), Plus Jakarta Sans (more personality than Outfit, excellent French support), and JetBrains Mono for all financial figures (tabular numerals built-in, reads as precision terminal data). The visual language is "premium grand registre" — every screen should feel like opening a leather-bound accounting book where each figure is printed with authority.

### Nouvelle palette
{"background":"#F6F2EC","surface":"#FFFFFF","surface_elevated":"#FBF8F4","border":"#E0D8CF","brand_primary":"#7B4A1E","brand_accent":"#D4891A","text_primary":"#1A140C","text_secondary":"#5C4A36","text_muted":"#9B887A","success":"#2E7D5A","warning":"#C46318","danger":"#B82929","rationale":"Background #F6F2EC is the exact warmth of pressed cream paper (vergé) — not blindingly white, which causes eye strain in full Dakar sun. Surface white #FFFFFF provides maximum contrast for card content on the cream background. Brand primary #7B4A1E (mahogany) has a luminance of ~0.099, giving 7.0:1 contrast on white — WCAG AAA. It reads as serious, warm, and deeply non-corporate; no fintech in West Africa owns this color. Brand accent #D4891A is the specific amber of 18k yellow gold as sold in Dakar's Sandaga market goldsmiths — used purely as a decorative, progress, and active-state color (not as text-on-white). Text primary #1A140C is near-black with warmth (contrast ~18.6:1 on white, ~17:1 on cream background — extreme legibility in full sun on any Android screen). Text secondary #5C4A36 and muted #9B887A stay in the warm-brown family — the palette never goes cold-gray. Success #2E7D5A is a deep forest green (wealth, settled accounts, compte soldé) that reads as earned rather than cheerful. Warning #C46318 is amber-orange, clearly distinct from the gold accent — the mind reads it as fire, urgency, heat — appropriate for retards. Danger #B82929 is deep warm red, not the bright Material red that reads as system error. Border #E0D8CF is sand, not gray — the page edges of a paper register."}

### Nouvelle typographie
Heading: Fraunces
Body: Plus Jakarta Sans
Fraunces is a 2020 optical-size variable serif (available on Google Fonts) designed with deliberate ink-trap quirks that only appear at large optical sizes — giving headings the quality of hand-pressed letterpress type without looking retro or decorative. It has never appeared in West African fintech and is visually unlike DM Serif Display in every optical-size variant. At display sizes (32px+) it has personality; at 18px it cleans up entirely. Plus Jakarta Sans replaces Outfit: both are humanist sans but Jakarta has wider glyph proportions, better French diacritics rendering, and a slightly more condensed rhythm that handles long Wolof/French labels without truncation. JetBrains Mono for all financial amounts is the decisive break from the current design: every FCFA figure — from KPI totals to schedule line items — appears in a true monospace with built-in tabular numerals. This creates a visual rhythm across the data layer that reads as precision instrument, not consumer app. The combination of an optical serif headline with a monospace data layer is used in Bloomberg Terminal, Linear, and Mercury Bank — but never in an African mobile finance context. It signals seriousness without requiring the user to know what a fintech is.

### Références
Mercury Bank (US) — warm premium palette, serious tone without being cold, excellent typographic hierarchy for financial data in a non-standard color palette, Stripe Invoicing dashboard — how to present tabular payment data with maximum density and zero visual noise, the benchmark for amount alignment and status chips, Linear — precision of micro-state indicators (the 3px left-border status pattern for issues is directly adaptable for payment schedule items), purposeful micro-animations, Papier (French stationery brand digital presence) — proof that ledger/paper aesthetics translate to digital without becoming nostalgic or skeuomorphic, editorial typography at scale, Wave Senegal — study the sunlight contrast strategy (not the color palette): extreme luminance difference between text and surface, no mid-tone surfaces, everything readable at arm's length in outdoor Dakar sun

### Ce qu'on a évité
DM Serif Display as heading font — it is the single most overused serif in AI-generated fintech interfaces worldwide in 2024-2026; its presence immediately signals template origin, Outfit as body font — paired with DM Serif it forms the definitive AI-template typography duo; Plus Jakarta Sans or IBM Plex Sans are materially different, The 2x2 KPI grid — every single fintech template, design system tutorial, and Figma community file uses this exact layout; it communicates nothing about the product's identity, Vertical login split (dark top block + white form below) — the current login IS a split, just vertical rather than horizontal; it is the second most common login pattern after the horizontal split, Floating phone mockup as landing hero — presenting a dashboard screenshot hovering above the fold is the universal default for SaaS landing pages and communicates nothing specific about the value proposition, Generic navy or corporate blue (#1B5FA8 or similar) as brand primary — this color is owned by every bank, telecom, and fintech in West Africa including the current app; it says nothing, withValues(alpha: x) tinted icon containers in KPI cards — the current pattern of icon in a 28x28 tinted box is copied verbatim from Material You guidelines and appears in thousands of apps, The emoji greeting Bonjour + 👋 in a large serif — warm intent but now a cliché across Flutter apps; replace with the dominant financial figure as the first visual anchor, White cards with only a border and zero elevation — the borderColor card style is the Vercel/Linear approach but requires the precision and spacing discipline of those apps to work; without that discipline it just looks unfinished, Progress bars as the primary status metaphor throughout every list item — reserve full progress bars for the detail view; use left-border color coding and percentage labels in the list

*Refonte par équipe agents design+frontend — 2026-07-03*
