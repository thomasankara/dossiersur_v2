# Préférences globales — Thomas

## Langue
- Réponses et commentaires en français
- Code, variables, commits, docstrings en anglais
- Specs et docs en français

## Stack par défaut
Next.js 15 (App Router, RSC) + TypeScript strict + Tailwind CSS v4
+ shadcn/ui + Supabase (Auth, DB, RLS, Storage) + Stripe + PostHog + Vercel

## Design System
- Composants UI : shadcn/ui (Radix primitives)
- Charts / KPIs : shadcn charts ou Tremor
- Landing / Marketing : Magic UI
- Animations : Framer Motion (subtiles uniquement)
- Icônes : Lucide React
- Pour les UI complexes depuis une maquette/screenshot : utiliser Gemini via MCP pour analyser l'image, puis implémenter en shadcn/ui

## Conventions code
- TypeScript strict mode (no `any`, no `as` sauf rare justification)
- Server Components par défaut, `use client` uniquement si interactivité nécessaire
- Server Actions dans des fichiers `actions.ts` séparés
- Zod pour toute validation d'input
- react-hook-form + @hookform/resolvers pour les formulaires
- Tests : Vitest + @testing-library/react
- Mobile-first responsive obligatoire
- Dark mode supporté via shadcn theming

## Workflow SDD
Pour chaque feature :
spec → research (si pertinent) → business challenge (si pricing/offer) → design → implement → review → security audit → tracking → deploy → monitor

## Conventions Git
- Commits atomiques, messages en anglais
- Format : type(scope): description
- Types : feat, fix, refactor, docs, test, chore, style

## Ce que je n'aime PAS
- Over-engineering quand simple suffit
- Abstractions prématurées
- Dépendances npm inutiles
- Code sans tests
- UI générique/moche — je veux du pro, du clean
- Console.log oubliés, TODO abandonnés
