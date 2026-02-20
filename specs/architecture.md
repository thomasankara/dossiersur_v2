# Architecture — DossierSûr v2

## Stack

- **Framework** : Next.js 15 (App Router, React Server Components)
- **Langage** : TypeScript strict
- **UI** : shadcn/ui + Tailwind CSS v4
- **Auth + DB** : Supabase (Auth, PostgreSQL, RLS, Storage)
- **Paiement** : Stripe (Checkout, Webhooks)
- **Analytics** : PostHog
- **Deploy** : Vercel (frontend + API) + service Python (analyse)
- **Tests** : Vitest + Testing Library

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Vercel                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Next.js 15 (App Router)                                     │  │
│  │                                                               │  │
│  │  (marketing)/          (auth)/           (dashboard)/         │  │
│  │  ├─ page.tsx (landing) ├─ login         ├─ page.tsx (liste)  │  │
│  │  ├─ pricing            ├─ signup        ├─ dossier/[id]      │  │
│  │  └─ legal/*            └─ forgot        └─ settings          │  │
│  │                                                               │  │
│  │  api/                                                         │  │
│  │  ├─ webhooks/stripe    Server Actions                        │  │
│  │  └─ analysis/proxy     ├─ dossier.ts                         │  │
│  │                        ├─ document.ts                         │  │
│  │                        └─ billing.ts                          │  │
│  └──────────────┬────────────────────────────┬──────────────────┘  │
│                 │                            │                      │
└─────────────────┼────────────────────────────┼──────────────────────┘
                  │                            │
        ┌─────────▼─────────┐        ┌────────▼────────────┐
        │  Supabase          │        │  Python API          │
        │  ├─ Auth           │        │  (FastAPI/Uvicorn)   │
        │  ├─ PostgreSQL     │        │                      │
        │  │  (+ RLS)        │        │  Pipeline 8 étapes   │
        │  └─ Storage        │        │  ├─ OCR (Gemini)     │
        │    (fichiers temp) │        │  ├─ Classification   │
        └────────────────────┘        │  ├─ Validation       │
                                      │  ├─ Cross-validation │
                                      │  └─ Scoring          │
                                      │         │            │
                                      └─────────┼────────────┘
                                                │
                                      ┌─────────▼────────────┐
                                      │  APIs externes        │
                                      │  ├─ Gemini 2.5 Flash  │
                                      │  ├─ INSEE Sirene      │
                                      │  └─ Brave Search      │
                                      └───────────────────────┘
```

## Choix d'architecture : Next.js + Python API séparé

### Pourquoi garder Python pour l'analyse

Le backend d'analyse v1 repose sur des libs Python matures sans équivalent TypeScript :
- `PyMuPDF` / `pdfplumber` : extraction PDF structurée
- `mrz` : parsing MRZ ICAO 9303
- `pylibdmtx` : décodage DataMatrix (binding C)
- `tdd` : vérification 2D-Doc ECDSA
- `pytesseract` : OCR fallback

Réécrire ces ~5 000 lignes en TypeScript serait risqué et sans valeur ajoutée. Le pipeline Python est **testé en conditions réelles** et représente le coeur de la valeur produit.

### Comment ça communique

1. L'utilisateur uploade un fichier via le frontend Next.js
2. Next.js stocke temporairement le fichier dans Supabase Storage
3. Une Server Action appelle l'API Python avec l'URL signée du fichier
4. L'API Python exécute le pipeline (steps 1-8) et renvoie le résultat JSON
5. Next.js persiste le résultat dans Supabase PostgreSQL
6. Le frontend affiche les résultats avec streaming progressif

### Déploiement Python API

Options par ordre de priorité :
1. **Railway / Render** : Dockerfile simple, scaling auto, pas de vendor lock-in
2. **Cloud Run (GCP)** : si on veut rester proche de l'écosystème Gemini
3. **VPS (Hetzner)** : si coûts deviennent un enjeu

## Structure dossiers

```
src/
├── app/
│   ├── (marketing)/                 # Pages publiques (pas de layout auth)
│   │   ├── page.tsx                 # Landing page
│   │   ├── pricing/page.tsx         # Pricing
│   │   └── legal/
│   │       ├── mentions-legales/page.tsx
│   │       ├── cgu/page.tsx
│   │       └── confidentialite/page.tsx
│   ├── (auth)/                      # Layout minimal centré
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/                 # Layout avec sidebar, protégé par middleware
│   │   ├── layout.tsx               # Sidebar + header + user menu
│   │   ├── page.tsx                 # Liste des dossiers (dashboard home)
│   │   ├── dossier/
│   │   │   ├── new/page.tsx         # Création dossier + upload
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Vue détaillée dossier
│   │   │       └── candidat/[cid]/page.tsx  # Détail candidat + documents
│   │   ├── settings/page.tsx        # Profil + facturation
│   │   └── billing/page.tsx         # Historique paiements + plan actuel
│   └── api/
│       ├── webhooks/
│       │   └── stripe/route.ts      # Webhook Stripe
│       └── analysis/
│           └── proxy/route.ts       # Proxy vers Python API (si SSE nécessaire)
├── actions/                         # Server Actions séparés
│   ├── dossier.ts                   # CRUD dossier, candidat, document
│   ├── document.ts                  # Upload, suppression, relance analyse
│   ├── billing.ts                   # Checkout, portail Stripe
│   └── auth.ts                      # Login, signup, logout, reset
├── components/
│   ├── ui/                          # shadcn/ui (générés)
│   ├── layouts/
│   │   ├── sidebar.tsx              # Navigation dashboard
│   │   ├── header.tsx               # Breadcrumbs + search + user menu
│   │   └── footer.tsx               # Footer marketing
│   ├── dossier/
│   │   ├── dossier-list.tsx         # Liste dossiers avec filtres
│   │   ├── dossier-card.tsx         # Card résumé dossier
│   │   ├── dossier-detail.tsx       # Vue détaillée
│   │   ├── candidat-panel.tsx       # Panel candidat + documents
│   │   ├── document-card.tsx        # Card document avec score
│   │   ├── upload-zone.tsx          # Drag & drop upload
│   │   ├── analysis-progress.tsx    # Progress steps 1-8
│   │   ├── score-badge.tsx          # Badge score coloré
│   │   ├── check-list.tsx           # Liste des checks (ok/warning/error)
│   │   └── cross-validation.tsx     # Résumé cross-validation
│   ├── billing/
│   │   ├── pricing-table.tsx        # 3 plans
│   │   ├── credits-counter.tsx      # Analyses restantes
│   │   └── checkout-button.tsx      # Bouton Stripe Checkout
│   └── marketing/
│       ├── hero.tsx                  # Hero section
│       ├── features.tsx             # Grille features
│       ├── how-it-works.tsx         # Étapes 1-2-3
│       ├── testimonials.tsx         # Avis clients
│       └── faq.tsx                  # FAQ accordion
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Client browser
│   │   ├── server.ts               # Client server (cookies)
│   │   ├── admin.ts                # Client service_role (webhooks)
│   │   └── middleware.ts            # Helper pour middleware auth
│   ├── stripe/
│   │   ├── client.ts               # Instance Stripe
│   │   ├── config.ts               # Plans, prices, features
│   │   └── webhooks.ts             # Handlers par event type
│   ├── analysis/
│   │   ├── client.ts               # Client HTTP vers Python API
│   │   └── types.ts                # Types partagés (résultats pipeline)
│   ├── posthog/
│   │   ├── client.ts               # Provider + init
│   │   └── events.ts               # Events centralisés (snake_case)
│   └── utils/
│       ├── cn.ts                    # clsx + twMerge
│       └── format.ts               # Formatage dates, montants, scores
├── types/
│   ├── database.ts                  # Types générés depuis Supabase
│   ├── analysis.ts                  # Types résultats analyse (miroir Python)
│   └── billing.ts                   # Types plans, subscriptions
├── hooks/
│   ├── use-analysis.ts              # Hook streaming résultats analyse
│   └── use-credits.ts              # Hook compteur crédits
└── middleware.ts                    # Auth guard + redirect
```

## Modèle de données (Supabase PostgreSQL)

### Tables

```sql
-- ⚠️ IMPORTANT : base de données partagée (projet "side_project", DB "perso-tracker")
-- Toutes les tables DossierSûr sont préfixées "ds_"
-- Ne JAMAIS toucher aux tables sans préfixe "ds_"

-- Utilisateurs (géré par Supabase Auth, étendu via ds_profiles)
create table ds_profiles (
  id uuid references auth.users primary key,
  email text not null,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,
  plan text not null default 'free',           -- 'free' | 'starter' | 'pro' | 'agency'
  credits_remaining int not null default 3,     -- analyses restantes (plan free = 3)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dossiers de candidature
create table ds_dossiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references ds_profiles(id) not null,
  name text,                                    -- nom libre donné par l'utilisateur
  status text not null default 'en_cours',      -- 'en_cours' | 'complet' | 'alerte'
  overall_score int,                            -- score global 0-100 (calculé)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Candidats dans un dossier
create table ds_candidats (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references ds_dossiers(id) on delete cascade not null,
  role text not null default 'locataire',       -- 'locataire' | 'co-locataire' | 'garant'
  nom text,                                     -- auto-rempli depuis 1er document
  prenom text,
  date_naissance text,                          -- DD/MM/YYYY
  created_at timestamptz not null default now()
);

-- Documents analysés
create table ds_documents (
  id uuid primary key default gen_random_uuid(),
  candidat_id uuid references ds_candidats(id) on delete cascade not null,
  dossier_id uuid references ds_dossiers(id) on delete cascade not null,
  filename text not null,
  file_hash text not null,                      -- SHA-256 pour détection doublons
  doc_type text not null,                       -- 'PDF', 'JPG', etc.
  classified_type text,                         -- 'Bulletin de paie', 'CNI', etc.
  confidence_score int,                         -- 0-100
  overall_status text,                          -- 'ok' | 'warning' | 'error'
  person jsonb,                                 -- PersonExtraction
  validation_result jsonb,                      -- ValidationResult complet
  analysis_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Résultats de cross-validation par candidat
create table ds_cross_validations (
  id uuid primary key default gen_random_uuid(),
  candidat_id uuid references ds_candidats(id) on delete cascade not null unique,
  dossier_id uuid references ds_dossiers(id) on delete cascade not null,
  checks jsonb not null,                        -- CrossValidationCheck[]
  overall_status text not null,
  confidence_score int not null,                -- 0-100
  completeness jsonb,                           -- { present, missing, score }
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Historique des paiements / crédits
create table ds_billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references ds_profiles(id) not null,
  type text not null,                           -- 'checkout' | 'credit_used' | 'subscription_renewed'
  stripe_event_id text,
  plan text,
  credits_added int default 0,
  amount_cents int,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Index (préfixés ds_)
create index ds_idx_dossiers_user on ds_dossiers(user_id);
create index ds_idx_candidats_dossier on ds_candidats(dossier_id);
create index ds_idx_documents_candidat on ds_documents(candidat_id);
create index ds_idx_documents_dossier on ds_documents(dossier_id);
create index ds_idx_documents_hash on ds_documents(file_hash);
create index ds_idx_billing_user on ds_billing_events(user_id);
```

### RLS Policies

```sql
-- ds_profiles : un utilisateur ne voit que son profil
alter table ds_profiles enable row level security;
create policy "ds_profiles_select_own"
  on ds_profiles for select using (auth.uid() = id);
create policy "ds_profiles_update_own"
  on ds_profiles for update using (auth.uid() = id);

-- ds_dossiers : isolation multi-tenant
alter table ds_dossiers enable row level security;
create policy "ds_dossiers_all_own"
  on ds_dossiers for all using (auth.uid() = user_id);

-- ds_candidats : via dossier ownership
alter table ds_candidats enable row level security;
create policy "ds_candidats_all_own"
  on ds_candidats for all using (
    dossier_id in (select id from ds_dossiers where user_id = auth.uid())
  );

-- ds_documents : via dossier ownership
alter table ds_documents enable row level security;
create policy "ds_documents_all_own"
  on ds_documents for all using (
    dossier_id in (select id from ds_dossiers where user_id = auth.uid())
  );

-- ds_cross_validations : via dossier ownership
alter table ds_cross_validations enable row level security;
create policy "ds_cross_validations_all_own"
  on ds_cross_validations for all using (
    dossier_id in (select id from ds_dossiers where user_id = auth.uid())
  );

-- ds_billing_events : un utilisateur ne voit que ses events
alter table ds_billing_events enable row level security;
create policy "ds_billing_events_select_own"
  on ds_billing_events for select using (auth.uid() = user_id);
```

## Flux de données principaux

### Flux 1 : Inscription + premier dossier

```
Visiteur → Landing page → CTA "Analyser mon dossier"
  → Redirect /signup (si non connecté)
  → Supabase Auth (email ou Google OAuth)
  → Trigger SQL : insert ds_profiles (plan='free', credits=3)
  → Redirect /dashboard
  → CTA "Nouveau dossier" → /dossier/new
  → Upload fichiers → déclenchement analyse
```

### Flux 2 : Upload et analyse d'un document

```
Utilisateur connecté → /dossier/[id] → Upload zone (drag & drop)
  → Client : validation extension + taille (<20 MB)
  → Server Action (document.ts) :
      1. Vérifier crédits restants (ou plan actif)
      2. Upload fichier → Supabase Storage (bucket temporaire)
      3. Générer URL signée
      4. Appel API Python : POST /analyze { file_url, options }
         → Python télécharge le fichier
         → Pipeline steps 1-7 (OCR, classif, validation)
         → Retour JSON : résultat complet
      5. Persister résultat → table ds_documents (validation_result jsonb)
      6. Si candidat a ≥2 documents :
         → Appel API Python : POST /cross-validate { documents }
         → Persister → table ds_cross_validations
      7. Recalculer score dossier
      8. Décrémenter crédits (billing_events)
      9. Supprimer fichier de Storage (RGPD)
  → Client : affichage progressif des résultats
```

### Flux 3 : Paiement Stripe

```
Utilisateur → /pricing → Choisit un plan
  → Server Action (billing.ts) :
      1. Créer/récupérer Stripe Customer (stripe_customer_id)
      2. Créer Stripe Checkout Session (mode 'payment' ou 'subscription')
      3. Redirect vers Stripe Checkout
  → Stripe Checkout → paiement → redirect success_url
  → Webhook Stripe → /api/webhooks/stripe :
      checkout.session.completed :
        → Ajouter crédits au profil
        → Insérer billing_event
      invoice.paid :
        → Renouveler crédits mensuels
      customer.subscription.deleted :
        → Downgrade plan → 'free'
```

### Flux 4 : Consultation dossier existant

```
Utilisateur → /dashboard → Liste dossiers (Supabase query + RLS)
  → Clic sur dossier → /dossier/[id]
  → Server Component : fetch dossier + candidats + documents (jointures)
  → Affichage : score global, liste candidats, détail checks
  → Possibilité : relancer cross-validation, supprimer document, ajouter document
```

## Intégrations externes

### Python Analysis API (interne)

- **Usage** : Exécution du pipeline d'analyse documentaire (steps 1-8)
- **Endpoints** :
  - `POST /analyze` : analyse un document (steps 1-7)
  - `POST /cross-validate` : cross-validation sur une liste de documents
  - `GET /health` : healthcheck
- **Auth** : API key partagée (header `X-API-Key`)
- **Format** : JSON (request + response)
- **Timeout** : 60s par document

### Supabase

- **Projet existant** : `side_project` — base de données `perso-tracker`
- **Convention** : toutes les tables préfixées `ds_`, toutes les RLS policies préfixées `ds_`
- **IMPORTANT** : ne jamais toucher aux tables sans préfixe `ds_` (autres projets)
- **Auth** : Email + Google OAuth, gestion sessions via `@supabase/ssr`
- **Database** : PostgreSQL avec RLS pour isolation multi-tenant
- **Storage** : Bucket `ds-documents` pour fichiers uploadés (supprimés après analyse)
- **Realtime** : Optionnel pour updates live sur dashboard

### Stripe

- **Checkout** : Sessions pour paiements one-shot et abonnements
- **Webhook** : `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
- **Customer Portal** : Gestion abonnement self-service
- **Plans** : Free (3 analyses), Starter (à l'usage), Pro (abo mensuel), Agency (volume)

### Google Gemini 2.5 Flash (via Python API)

- **Usage** : OCR, classification, extraction, validation, matching
- **Volume** : 3-6 appels par document
- **Coût** : ~0,01-0,05 € par document
- **Fallback** : Tesseract pour OCR si Gemini bloqué

### INSEE Sirene v3.11 (via Python API)

- **Usage** : Vérification SIRET/SIREN
- **Fallback** : Brave Search

### PostHog

- **Usage** : Analytics, funnels, feature flags
- **Config** : EU cloud (`eu.i.posthog.com`), IP anonymisée, pas de PII
- **Events** : Définis dans `docs/analytics-plan.md`

## Choix techniques et justifications

### Next.js 15 App Router (pas Pages Router)
- Server Components par défaut → moins de JS client, meilleur SEO
- Server Actions → mutations sans API REST
- Streaming → affichage progressif des résultats d'analyse
- Middleware → auth guard centralisé

### Python API séparé (pas tout en TypeScript)
- Libs OCR/crypto matures sans équivalent TS (PyMuPDF, mrz, pylibdmtx, tdd)
- ~5 000 lignes de logique métier testée en conditions réelles
- Découplage : le frontend peut évoluer indépendamment du moteur d'analyse
- Scaling indépendant : l'analyse est CPU-intensive, le frontend non

### Supabase (pas Prisma + PostgreSQL auto-hébergé)
- Auth intégré (email + OAuth) sans code custom
- RLS natif PostgreSQL → sécurité multi-tenant sans middleware
- Storage pour fichiers temporaires (bucket `ds-documents`)
- Dashboard admin pour debug
- Migration SQL native (pas d'ORM)
- Base partagée `perso-tracker` : préfixe `ds_` sur toutes les tables/policies

### JSONB pour résultats d'analyse (pas de tables normalisées)
- Les résultats d'analyse sont complexes et imbriqués (checks, forensic, math, etc.)
- Pas besoin de requêtes SQL sur les champs individuels des checks
- Flexibilité pour ajouter de nouveaux checks sans migration
- Seuls `confidence_score` et `overall_status` sont en colonnes (pour filtres/tris)

### Stripe Checkout (pas Elements)
- PCI DSS compliance sans effort
- Gestion complète du flow de paiement
- Support natif abonnements + one-shot
- Customer Portal pour self-service

## Sécurité

### Checklist

- [ ] RLS activé sur toutes les tables
- [ ] Policies testées (SELECT, INSERT, UPDATE, DELETE)
- [ ] `service_role` key jamais exposée côté client
- [ ] Middleware auth protège `/dashboard/*`
- [ ] Webhook Stripe : signature vérifiée (`constructEvent`)
- [ ] API Python : authentifiée par API key
- [ ] Rate limiting par utilisateur + par IP
- [ ] Validation taille fichier (max 20 MB)
- [ ] CORS restreint
- [ ] Pas de `dangerouslySetInnerHTML`
- [ ] Headers sécurité (CSP, X-Frame-Options) via `next.config.ts`
- [ ] Secrets en env vars serveur uniquement
- [ ] RGPD : consentement, rétention, droit suppression

## Performance

### Optimisations prévues

- **Server Components** : pas de JS inutile côté client
- **Streaming** : affichage progressif pendant l'analyse
- **Optimistic UI** : feedback immédiat avant réponse serveur
- **Images** : `next/image` pour optimisation automatique
- **Cache** : `revalidate` sur les pages dashboard (ISR)
- **Bundle** : import dynamique (`next/dynamic`) pour composants lourds
