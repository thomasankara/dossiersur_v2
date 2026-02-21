# DossierSûr v2 — État actuel (20 février 2026)

## Sprints terminés
- Sprint 1 : Setup, DB, Auth, Dashboard layout
- Sprint 2 : CRUD dossiers, upload/analyse pipeline
- Sprint 3 : Stripe (checkout, webhooks, pricing, billing)
- Sprint 4 : Landing page, settings, PostHog, SEO, legal
- Sprint 5 : Tests (168, 93.7% coverage), sécurité (open redirect, rate limit), CI/CD

## Configuration .env.local
| Variable | Statut |
|----------|--------|
| NEXT_PUBLIC_SUPABASE_URL | OK |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | OK |
| SUPABASE_SERVICE_ROLE_KEY | OK |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | OK (pk_test_...) |
| STRIPE_SECRET_KEY | OK (sk_test_...) |
| STRIPE_PRICE_STARTER | OK (price_1T2xKLL0OHt0t4W1EucHpKTs) |
| STRIPE_PRICE_PRO | OK (price_1T2xKLL0OHt0t4W1N4SiBXmW) |
| STRIPE_PRICE_BUSINESS | OK (price_1T2xKLL0OHt0t4W1TuvIbjc9) |
| STRIPE_WEBHOOK_SECRET | MANQUANT — nécessite Stripe CLI |
| NEXT_PUBLIC_POSTHOG_KEY | OK (phx_...) |
| NEXT_PUBLIC_POSTHOG_HOST | OK (eu.i.posthog.com) |
| ANALYSIS_API_URL | MANQUANT — API Python pas encore déployée |
| ANALYSIS_API_KEY | MANQUANT — API Python pas encore déployée |

## TODO pour reprendre
1. **Installer Stripe CLI** pour le webhook secret :
   ```bash
   bash /tmp/install-stripe.sh
   # puis :
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   # copier le whsec_... dans .env.local
   ```
2. **Commit Sprint 5** — les changements ne sont pas encore commités
3. **Prochaines étapes** : déploiement Vercel, API Python d'analyse, tests E2E
