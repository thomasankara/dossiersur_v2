# DossierSûr v2

SaaS de vérification de dossiers locatifs. Détection de fraude documentaire.

## Stack
- Next.js 15 (App Router, RSC) + TypeScript strict + Tailwind CSS v4
- shadcn/ui (new-york style) + Lucide React
- Supabase (Auth, PostgreSQL + RLS, Storage)
- Stripe (Checkout, Webhooks)
- PostHog (EU cloud)
- Python API séparé pour l'analyse documentaire

## Commands
- `npm run dev` — dev server (turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — Vitest (quand configuré)

## Supabase
- Projet existant : `side_project`, base `perso-tracker`
- Toutes les tables préfixées `ds_` (ds_profiles, ds_dossiers, ds_candidats, ds_documents, ds_cross_validations, ds_billing_events)
- RLS policies préfixées `ds_`
- Ne JAMAIS toucher aux tables sans préfixe `ds_`
- Storage bucket : `ds-documents`

## Conventions
- Server Components par défaut, `use client` seulement si interactivité
- Server Actions dans `src/actions/*.ts`
- Validation Zod pour tous les inputs
- Mobile-first responsive
- Dark mode via shadcn theming
- Fonts : DM Serif Display (headings), Inter (body)
- Couleurs : cream #F2F2F0, burgundy #400202, accent #8C3A3A, valid #2D6A4F

## Architecture
- `src/app/(marketing)/` — pages publiques (landing, pricing, legal)
- `src/app/(auth)/` — login, signup, forgot-password
- `src/app/(dashboard)/` — dashboard protégé par middleware
- `src/actions/` — Server Actions
- `src/components/` — composants (ui/, layouts/, dossier/, billing/, marketing/)
- `src/lib/` — utilitaires (supabase/, stripe/, analysis/, posthog/, utils/)
- `src/types/` — types TypeScript
- `src/hooks/` — hooks custom
