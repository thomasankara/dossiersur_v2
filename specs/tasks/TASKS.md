# Tasks — DossierSûr v2

> Tâches ordonnées par priorité. MVP d'abord, puis améliorations post-launch.
> Chaque tâche inclut ses dépendances et critères de validation.

---

## MVP — Sprint 1 : Setup & Auth (~1 semaine)

### 1.1 Setup projet Next.js
- [ ] `npx create-next-app@latest . --typescript --tailwind --app --src-dir`
- [ ] `npx shadcn@latest init` (style default, couleur zinc)
- [ ] Configurer TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess: true`)
- [ ] Installer dépendances : `@supabase/supabase-js @supabase/ssr stripe posthog-js zod react-hook-form @hookform/resolvers lucide-react`
- [ ] Créer `.env.local` depuis `.env.local.example`
- [ ] Configurer `CLAUDE.md` projet
- [ ] Structure dossiers initiale (`actions/`, `lib/`, `types/`, `hooks/`)
- **Validation** : `npm run build` passe, page d'accueil s'affiche

### 1.2 Supabase : schéma de base de données
- [ ] Créer projet Supabase
- [ ] Migration initiale : tables `profiles`, `dossiers`, `candidats`, `documents`, `cross_validations`, `billing_events`
- [ ] Index sur les clés étrangères et colonnes fréquemment filtrées
- [ ] Activer RLS sur toutes les tables
- [ ] Policies RLS : isolation multi-tenant (chaque user ne voit que ses données)
- [ ] Trigger : auto-création profil à l'inscription (`on auth.users insert`)
- [ ] Générer types TypeScript (`supabase gen types typescript`)
- **Validation** : policies testées via SQL Editor Supabase, types générés

### 1.3 Authentification Supabase
- [ ] Client Supabase browser (`lib/supabase/client.ts`)
- [ ] Client Supabase server (`lib/supabase/server.ts`)
- [ ] Client Supabase admin (`lib/supabase/admin.ts`)
- [ ] `middleware.ts` : refresh token + protection routes `/dashboard/*`
- [ ] Page `/login` (email + Google OAuth)
- [ ] Page `/signup` (email + Google OAuth)
- [ ] Page `/forgot-password`
- [ ] Server Actions : login, signup, logout, reset password (`actions/auth.ts`)
- [ ] Redirect post-login vers `/dashboard`
- **Validation** : inscription, connexion, déconnexion, reset fonctionnels

### 1.4 Layout dashboard
- [ ] Layout `(dashboard)/layout.tsx` : sidebar + header + user menu
- [ ] Composant sidebar (navigation : Dossiers, Paramètres, Facturation)
- [ ] Composant header (breadcrumbs + user avatar dropdown)
- [ ] Page `/dashboard` placeholder (liste dossiers vide)
- [ ] Page `/settings` (profil utilisateur, changement email/mot de passe)
- [ ] Responsive : sidebar collapse sur mobile
- [ ] Dark mode supporté
- **Validation** : navigation fluide, responsive, dark mode fonctionnel

---

## MVP — Sprint 2 : Pipeline d'analyse (~2 semaines)

### 2.1 API Python : containerisation et déploiement
- [ ] Dockerfile pour le backend Python v1
- [ ] Ajouter `pikepdf` au `requirements.txt` + pin toutes les versions
- [ ] Endpoint d'auth : vérification API key (header `X-API-Key`)
- [ ] Endpoint `/analyze` : accepte un fichier (multipart ou URL), retourne JSON
- [ ] Endpoint `/cross-validate` : accepte liste de résultats, retourne JSON
- [ ] Endpoint `/health` : healthcheck
- [ ] Déployer sur Railway/Render
- [ ] Variable d'env `ANALYSIS_API_URL` + `ANALYSIS_API_KEY` dans Next.js
- **Validation** : `curl /health` retourne 200, `/analyze` avec un PDF retourne un résultat complet

### 2.2 Upload et analyse de documents
- [ ] Composant `upload-zone.tsx` (drag & drop, multi-fichiers, validation extension + taille)
- [ ] Server Action `actions/document.ts` : upload → Supabase Storage → appel Python API → persist résultat → supprimer fichier
- [ ] Vérification crédits avant analyse
- [ ] Persist résultat dans table `documents` (validation_result jsonb)
- [ ] Auto-remplissage candidat (nom, prénom) depuis extraction personne
- [ ] Détection doublons (file_hash SHA-256)
- [ ] Cross-validation auto si candidat a ≥2 documents
- [ ] Persist cross-validation dans table `cross_validations`
- [ ] Recalcul score dossier après chaque document
- **Validation** : upload un PDF → résultat complet affiché, persisté en base, fichier supprimé du Storage

### 2.3 Client API Python
- [ ] `lib/analysis/client.ts` : wrapper HTTP vers Python API
- [ ] `lib/analysis/types.ts` : types TypeScript miroir des modèles Pydantic (ValidationResult, CrossValidationResult, etc.)
- [ ] Gestion timeout (60s), retry (1 fois), error handling
- [ ] Validation Zod des réponses
- **Validation** : types alignés avec les réponses réelles de l'API Python

### 2.4 CRUD dossiers et candidats
- [ ] Server Actions `actions/dossier.ts` : create, update, delete dossier + add/remove candidat
- [ ] Page `/dossier/new` : formulaire création dossier + zone upload
- [ ] Page `/dossier/[id]` : vue détaillée (candidats, documents, scores)
- [ ] Page `/dossier/[id]/candidat/[cid]` : détail candidat + liste documents + checks
- [ ] Composant `dossier-list.tsx` : liste avec filtres (statut, date, score)
- [ ] Composant `dossier-card.tsx` : card résumé (nom, statut, score, date, nb docs)
- [ ] Suppression document + recalcul cross-validation
- **Validation** : CRUD complet fonctionnel, RLS vérifié (user A ne voit pas les dossiers de user B)

### 2.5 Affichage des résultats d'analyse
- [ ] Composant `score-badge.tsx` : badge coloré (vert ≥80, orange 50-79, rouge <50)
- [ ] Composant `check-list.tsx` : liste des checks avec icônes ok/warning/error + message
- [ ] Composant `document-card.tsx` : card document (type, score, statut, nb checks)
- [ ] Composant `cross-validation.tsx` : résumé cross-validation (complétude, checks inter-docs)
- [ ] Composant `analysis-progress.tsx` : indicateur de progression pendant l'analyse
- [ ] Section forensic : métadonnées PDF, outils détectés
- [ ] Section personne : nom, prénom, source extraction, confiance
- **Validation** : résultats lisibles, compréhensibles pour un non-technique, responsive

---

## MVP — Sprint 3 : Paiement (~1 semaine)

### 3.1 Configuration Stripe
- [ ] Créer produits et prix dans Stripe Dashboard (Free, Starter, Pro, Agency)
- [ ] `lib/stripe/client.ts` : instance Stripe
- [ ] `lib/stripe/config.ts` : mapping plans → prix → features → crédits
- [ ] Ajouter `stripe_customer_id` au profil à la première interaction Stripe
- **Validation** : config Stripe prête, produits créés

### 3.2 Pricing page
- [ ] Page `/pricing` : 3-4 plans avec features, prix, CTA
- [ ] Composant `pricing-table.tsx` : comparaison plans (highlight recommandé)
- [ ] Plan recommandé visuellement distinct
- [ ] CTA adapté : "Commencer gratuitement" (free) vs "Choisir ce plan" (payant)
- **Validation** : page responsive, CTA fonctionnels

### 3.3 Checkout et webhooks
- [ ] Server Action `actions/billing.ts` : créer Checkout Session Stripe
- [ ] Route API `/api/webhooks/stripe` : handler webhook
- [ ] Handler `checkout.session.completed` : ajouter crédits + billing_event
- [ ] Handler `invoice.paid` : renouveler crédits mensuels
- [ ] Handler `customer.subscription.deleted` : downgrade → free
- [ ] Vérification signature webhook (`stripe.webhooks.constructEvent`)
- [ ] Composant `credits-counter.tsx` : affichage crédits restants dans le dashboard
- [ ] Paywall : bloquer analyse si crédits épuisés, redirect vers pricing
- **Validation** : paiement test → crédits ajoutés, paywall fonctionnel, webhook vérifié

### 3.4 Page facturation
- [ ] Page `/billing` : plan actuel, crédits restants, historique
- [ ] Bouton "Gérer mon abonnement" → Stripe Customer Portal
- [ ] Historique billing_events (date, type, montant, crédits)
- **Validation** : page affiche correctement le plan et l'historique

---

## MVP — Sprint 4 : Landing & Polish (~1 semaine)

### 4.1 Landing page
- [ ] Hero : titre, sous-titre, CTA, illustration/démo visuelle
- [ ] Section problème (statistiques fraude)
- [ ] Section solution (comment ça marche en 3 étapes)
- [ ] Section features (grille avec icônes Lucide)
- [ ] Section pricing (intégrée ou lien vers /pricing)
- [ ] Section FAQ (accordion shadcn)
- [ ] Footer (mentions légales, CGU, confidentialité, contact)
- [ ] Responsive mobile-first
- **Validation** : page professionnelle, responsive, CTA vers signup

### 4.2 Pages légales
- [ ] `/legal/mentions-legales` : mentions légales
- [ ] `/legal/cgu` : conditions générales d'utilisation
- [ ] `/legal/confidentialite` : politique de confidentialité + RGPD
- **Validation** : pages rédigées, accessibles depuis le footer

### 4.3 SEO et meta
- [ ] `metadata` dans chaque `layout.tsx` et `page.tsx` (title, description, og:image)
- [ ] `robots.ts` : allow marketing pages, disallow dashboard
- [ ] `sitemap.ts` : pages publiques
- [ ] Favicon et og:image
- **Validation** : meta tags présents, sitemap accessible

### 4.4 PostHog analytics
- [ ] Provider PostHog dans le layout root
- [ ] `lib/posthog/events.ts` : events centralisés (cf `docs/analytics-plan.md`)
- [ ] Tracking : auth_signup, auth_login, page_viewed, dossier_created, document_analyzed, payment_completed
- [ ] Config : EU cloud, IP anonymisée, pas de PII
- [ ] Banner consentement cookies (avant init PostHog)
- **Validation** : events visibles dans PostHog dashboard, consentement fonctionnel

### 4.5 Error handling global
- [ ] `error.tsx` dans chaque route group (marketing, auth, dashboard)
- [ ] `not-found.tsx` global
- [ ] `loading.tsx` avec skeletons dans le dashboard
- [ ] Toast notifications (shadcn toast) pour feedback actions
- **Validation** : erreurs gracieuses, pas de page blanche, feedback utilisateur

---

## MVP — Sprint 5 : Tests & Sécurité (~1 semaine)

### 5.1 Tests
- [ ] Setup Vitest + Testing Library + happy-dom
- [ ] Tests unitaires : fonctions utilitaires (`lib/utils/`)
- [ ] Tests unitaires : types et validation Zod (`lib/analysis/types.ts`)
- [ ] Tests composants : `score-badge`, `check-list`, `pricing-table`
- [ ] Tests Server Actions : mocks Supabase + Python API
- [ ] Tests webhook Stripe : vérification signature, handlers
- [ ] Coverage cible : >60% (MVP), >80% (post-MVP)
- **Validation** : `npm test` passe, coverage >60%

### 5.2 Audit sécurité
- [ ] Vérifier RLS policies (aucune fuite de données cross-user)
- [ ] Vérifier `service_role` key jamais exposée client-side
- [ ] Vérifier webhook Stripe signature
- [ ] Vérifier rate limiting en place
- [ ] Vérifier headers sécurité (`next.config.ts`)
- [ ] Vérifier CORS restreint sur Python API
- [ ] Vérifier validation taille fichier (max 20 MB)
- [ ] Scan dépendances (`npm audit`)
- **Validation** : aucune vulnérabilité critique

### 5.3 CI/CD
- [ ] GitHub Actions : lint + typecheck + tests + build sur chaque PR
- [ ] Vercel : déploiement auto sur push main
- [ ] Preview deployments sur PR
- [ ] Supabase migrations : process documenté
- **Validation** : pipeline CI/CD fonctionnel, preview deployments actifs

---

## Post-MVP — Améliorations

### 6.1 Export rapport PDF
- [ ] Génération rapport PDF professionnel (résumé dossier + détail checks)
- [ ] Téléchargement depuis la page dossier
- [ ] Design propre avec logo, scores colorés, recommandations

### 6.2 Notifications email
- [ ] Email de bienvenue post-inscription
- [ ] Email résultat d'analyse prêt (si analyse longue)
- [ ] Email alerte fraude détectée (score < 50)

### 6.3 Lien de partage
- [ ] Générer un lien sécurisé (token signé, expiration 7j)
- [ ] Page publique avec zone upload (locataire uploade pour le bailleur)
- [ ] Documents routés automatiquement vers le bon dossier

### 6.4 Dashboard agence
- [ ] Rôle "agency" avec multi-utilisateurs
- [ ] Invitations par email
- [ ] Dashboard agrégé (stats, volume, alertes)

### 6.5 Optimisations
- [ ] Cache OCR : hash fichier → résultat pipeline (éviter appels Gemini redondants)
- [ ] Onboarding guidé (première analyse accompagnée)
- [ ] Mode comparaison multi-candidats
- [ ] Barème PAS dynamique (mise à jour annuelle)

### 6.6 Monitoring
- [ ] Sentry pour error tracking
- [ ] PostHog dashboards : funnel inscription → analyse → paiement
- [ ] Alertes : taux d'erreur API Python, webhook Stripe échoués
- [ ] Health dashboard : latence analyse, disponibilité services
