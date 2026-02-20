# Audit v1 — DossierSûr (dossiersur)

> Audit effectué le 2026-02-20 sur le projet `/home/thomas24/mes_developpements/dossiersur`
> Version : 0.5.0 — MVP fonctionnel, stockage in-memory
> Codebase : ~9 700 lignes Python (hors venv et templates HTML)

---

## 1. Présentation

**DossierSûr** est une plateforme de détection de fraude documentaire pour dossiers locatifs en France. Elle analyse automatiquement les documents (bulletins de paie, CNI, avis d'imposition, etc.) via un pipeline à **8 étapes** combinant OCR, LLM, cryptographie et cross-validation inter-documents.

### Problème adressé

- **10% des dossiers locatifs** contiennent des documents falsifiés (2025)
- **1 dossier sur 4** est frauduleux en Île-de-France (Finovox)
- Les bulletins de paie sont le document le plus falsifié
- Un pack frauduleux complet se vend ~180 € en ligne
- Aucune solution accessible aux **3,5 millions de bailleurs particuliers** en France

---

## 2. Stack technique v1

| Couche | Technologie | Version |
|--------|------------|---------|
| **Backend** | Python + FastAPI | 3.11+ / 0.109.0 |
| **ASGI** | Uvicorn | 0.27.0 |
| **Validation** | Pydantic v2 | 2.5.3 |
| **PDF** | PyMuPDF + pdfplumber | 1.24.0 / 0.10.3 |
| **LLM** | Google Gemini 2.5 Flash | google-genai ≥1.0.0 |
| **OCR fallback** | Tesseract | pytesseract ≥0.3.10 |
| **Identité** | mrz (ICAO 9303) + pylibdmtx + tdd | 0.6.2 / ≥0.1.10 / git |
| **HTTP** | httpx (async) | 0.26.0 |
| **Frontend** | HTML/JS/CSS vanilla + Tailwind CDN v4 | — |
| **Stockage** | Dict Python in-memory | aucune persistance |
| **Streaming** | Server-Sent Events (SSE) natif | — |

### APIs externes

| Service | Usage | Auth |
|---------|-------|------|
| **Google Gemini 2.5 Flash** | OCR, classification, extraction, validation (3-6 appels/doc) | API key |
| **INSEE Sirene v3.11** | Vérification SIRET entreprise | Header API key |
| **Brave Search** | Fallback vérification entreprise | Header token |

### Dépendances système

```bash
tesseract-ocr tesseract-ocr-fra libdmtx0b
```

---

## 3. Architecture v1

```
┌──────────────┐    SSE     ┌──────────────────────────────────────────┐
│  Browser     │◄──────────►│  FastAPI (Uvicorn)                      │
│  index.html  │  HTTP/POST │                                          │
│  Tailwind    │            │  Routers ──► Pipeline Service (Steps 1-7)│
│  Vanilla JS  │            │                      │                   │
│  localStorage│            │              Services spécialisés        │
│              │            │              ├─ classifier (OCR+classif) │
│              │            │              ├─ identity (MRZ ICAO 9303) │
│              │            │              ├─ person_extraction (LLM)  │
│              │            │              ├─ forensic (métadonnées)   │
│              │            │              ├─ math_validation (LLM)   │
│              │            │              ├─ company_verif (SIRET×3)  │
│              │            │              ├─ twodoc (DataMatrix ECDSA)│
│              │            │              ├─ validation/ (9 modules)  │
│              │            │              └─ cross_validation/ (step8)│
│              │            │                      │                   │
│              │            │              dossier_store.py (in-memory)│
└──────────────┘            └──────────────────────────────────────────┘
                                      │          │           │
                            ┌─────────▼──┐ ┌────▼─────┐ ┌──▼──────┐
                            │ Gemini API │ │ INSEE    │ │ Brave   │
                            │ 2.5 Flash  │ │ Sirene   │ │ Search  │
                            └────────────┘ └──────────┘ └─────────┘
```

### Structure fichiers

```
backend/
├── main.py                           # Entry point FastAPI + CORS
├── dossier_store.py                  # Dict global in-memory
├── config/
│   ├── constants.py                  # Extensions, MIME types, seuils
│   └── thresholds.py                 # 218 lignes — pénalités, ratios, dates
├── models/
│   └── schemas.py                    # Pydantic v2 models (254 lignes)
├── routers/
│   ├── extract.py                    # POST /extract (multi-files SSE)
│   ├── dossier.py                    # CRUD dossier/candidat/document (307 lignes)
│   ├── health.py                     # GET /health
│   └── ui.py                         # GET / (sert le HTML)
├── helpers/
│   ├── gemini_client.py              # Client Gemini partagé
│   ├── person.py                     # Person matching/extraction
│   └── sse.py                        # Formatage SSE
├── services/
│   ├── pipeline_service.py           # Orchestrateur steps 1-7 (379 lignes)
│   ├── classifier_service.py         # OCR + classification (251 lignes)
│   ├── identity_service.py           # MRZ parsing ICAO 9303 (927 lignes)
│   ├── person_extraction_service.py  # Extraction personne Gemini LLM
│   ├── forensic_service.py           # Analyse métadonnées PDF (324 lignes)
│   ├── math_validation_service.py    # Montants bulletins Gemini (300 lignes)
│   ├── company_verification_service.py # SIRET 3 niveaux (390 lignes)
│   ├── twodoc_service.py             # DataMatrix + ECDSA signature
│   ├── validation/                   # 9 modules par type de document
│   │   ├── __init__.py               # Dispatcher (226 lignes)
│   │   ├── _payslip.py              # Bulletin de paie
│   │   ├── _identity.py             # CNI / Passeport / Titre de séjour
│   │   ├── _tax_notice.py           # Avis d'imposition
│   │   ├── _housing.py              # Justif. domicile / Quittance
│   │   ├── _employment.py           # Contrat / Attestation employeur
│   │   ├── _financial.py            # RIB / Relevé de compte
│   │   └── _shared.py               # Forensic, SIRET, scoring partagé
│   └── cross_validation/            # Step 8 (19 checks)
│       ├── __init__.py               # Orchestrateur (232 lignes)
│       ├── _payslip_checks.py       # 7 checks bulletins
│       ├── _document_checks.py      # 12 checks inter-documents
│       ├── _completeness.py         # Décret 2015-1437
│       └── _helpers.py              # Utilitaires
└── templates/
    └── index.html                    # UI single-page (1 382 lignes)
```

---

## 4. Features implémentées — À conserver

### 4.1 Pipeline d'analyse (Steps 1-8)

| Étape | Description | Technologie | Priorité v2 |
|-------|-------------|-------------|-------------|
| 1 | Identification fichier (type, taille) | FastAPI multipart | Conserver |
| 2 | Métadonnées PDF (creator, dates, polices) | PyMuPDF | Conserver |
| 3 | Double OCR (pdfplumber + Gemini Vision, fallback Tesseract) | pdfplumber, Gemini, Tesseract | Conserver |
| 4 | Extraction tables | pdfplumber | Conserver |
| 5 | Classification (13 types) | Gemini 2.5 Flash | Conserver |
| 6 | Extraction personne (MRZ + Gemini) | mrz + Gemini | Conserver |
| 7 | Validation par type (9 types, checks spécialisés) | Services dédiés | Conserver |
| 8 | Cross-validation inter-documents (19 checks) | Logique custom | Conserver |

### 4.2 Types de documents supportés (13)

| Type | Checks clés | État |
|------|------------|------|
| **Bulletin de paie** | Ratio net/brut, cumuls progressifs, NIR, SIRET×3, taux PAS, forensic, adresse | ✅ Complet |
| **CNI / Passeport / Titre de séjour** | MRZ ICAO 9303, check digits, expiration, 2D-Doc ECDSA | ✅ Complet |
| **Avis d'imposition** | N° fiscal, référence avis, année, 2D-Doc signature, cross-ref RFR | ✅ Complet |
| **Justificatif de domicile** | Date < 3 mois, fournisseur connu, adresse Gemini | ✅ Complet |
| **Contrat de travail** | CDI/CDD, SIRET×3, termes Gemini (salaire, poste, durée) | ✅ Complet |
| **Attestation employeur** | SIRET×3, date < 3 mois | ✅ Complet |
| **RIB** | IBAN checksum ISO 7064, BIC/SWIFT, code banque CFONB | ✅ Complet |
| **Quittance de loyer** | Montant, date, bailleur, mots-clés, adresse Gemini | ✅ Complet |
| **Relevé de compte** | IBAN, titulaire, banque, date | ✅ Complet |
| **Facture** | Forensic uniquement | ⚠️ Partiel |
| **Autre/Non identifié** | Forensic uniquement | ⚠️ Partiel |

### 4.3 Cross-validation (Step 8) — 19 checks

**Complétude (décret 2015-1437) :**
- Vérification documents obligatoires par rôle (locataire, garant)

**Bulletins de paie (7 checks) :**
1. Cumuls progressifs (brut + net imposable)
2. Taux PAS constant entre bulletins consécutifs
3. Détection cumuls dupliqués (copy-paste)
4. Salary spikes (>30% warning, >50% error)
5. Lacunes de mois (gaps détectés)
6. Progression salariale suspecte (CV=0, linéaire parfait)
7. PAS vs barème officiel 2024

**Inter-documents (12 checks) :**
1. Net imposable vs RFR (±20%)
2. Même employeur (SIRET identique)
3. Même personne sur tous les documents
4. Cohérence adresse (code postal + rue via Gemini)
5. Nom entreprise vs INSEE
6. Date embauche vs 1er bulletin
7. IBAN RIB = IBAN bulletins/relevé
8. Salaire contrat vs moyenne bulletins (±10%)
9. Ratio d'effort loyer/revenus < 33%
10. Titulaire RIB vs nom candidat
11. Cohérence rue adresse
12. Analyse de placements

### 4.4 Analyse forensique

- Détection outils suspects (18 outils : Canva, Photoshop, Sejda, ilovepdf…)
- Fingerprint logiciel : paie/gouvernement/bureau/consumer/suspect
- Comptage polices (> 3 = suspect)
- Cohérence date création PDF vs date document

### 4.5 Vérifications cryptographiques

| Algorithme | Standard | Implémentation |
|-----------|----------|----------------|
| MRZ Check Digits | ICAO 9303 | Poids [7,3,1], mod 10, TD1/TD2/TD3 |
| 2D-Doc ECDSA | P-256 DGFIP/ANTS | Via lib `tdd` (GitHub) |
| IBAN Checksum | ISO 7064 mod-97 | Rearrange + conversion lettres |
| SIRET Checksum | Luhn | Double-impair |
| NIR Checksum | Modulo 97 | Gestion Corse (2A→19, 2B→18) |

### 4.6 Scoring

**Document solo (Step 7)** : `100 - Σ pénalités pondérées` → 0-100

**Pénalités critiques** (-25 à -35 pts) :
- 2D-Doc signature invalide, check digits MRZ invalides, outils forensic suspects

**Pénalités importantes** (-15 à -20 pts) :
- Ratio net/brut hors plage, IBAN invalide, SIRET invalide

**Score dossier (Step 8)** : `60% moyenne docs + 40% cross-validation` → 0-100

### 4.7 API REST

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/extract` | Analyse multi-fichiers, SSE streaming |
| `POST` | `/dossier` | Création dossier |
| `GET` | `/dossier/{id}` | Récupération dossier |
| `GET` | `/dossiers` | Liste tous les dossiers |
| `POST` | `/dossier/{id}/candidat` | Ajout candidat (rôle) |
| `POST` | `/dossier/{id}/candidat/{cid}/document` | Upload + pipeline + step 8, SSE |
| `DELETE` | `/dossier/{id}/candidat/{cid}/document/{idx}` | Suppression document |
| `GET` | `/dossier/{id}/candidat/{cid}/cross-validation` | Cross-validation manuelle |
| `GET` | `/health` | Healthcheck |

### 4.8 Fonctionnalités annexes

- **Auto-routing** : Matching LLM pour router les documents vers le bon candidat
- **Détection doublons** : Hash SHA-256, erreur 409 Conflict
- **SSE streaming** : Résultats temps réel par étape
- **Drag & drop** : Upload fichier ou dossier complet

---

## 5. Logique métier à conserver impérativement

### 5.1 Seuils et constantes (`config/thresholds.py`)

```python
# Ratios financiers bulletins
EXPECTED_NET_BRUT_RATIO = 0.77       # 77% net/brut attendu
NET_BRUT_RATIO_TOLERANCE = 0.08      # ±8%
CUMUL_TOLERANCE_PERCENT = 0.02       # 2% arrondis
PAS_RATE_MAX = 45.0                  # Tranche marginale
PAS_RATE_HIGH_THRESHOLD = 20.0       # Warning si >20%

# Cross-validation
RFR_TOLERANCE = 0.20                 # ±20% net imposable vs RFR
SALARY_CONTRACT_TOLERANCE = 0.10     # ±10% contrat vs bulletins
EFFORT_RATIO_OK = 0.33               # 33% loyer/revenus = ok
EFFORT_RATIO_WARNING = 0.40          # 40% = warning
SALARY_SPIKE_THRESHOLD = 0.30        # 30% variation = warning
SALARY_SPIKE_CRITICAL = 0.50         # 50% = error

# Dates
MAX_DOCUMENT_AGE_MONTHS = 3          # Bulletins, justificatifs < 3 mois
MAX_AVIS_IMPOSITION_YEARS = 2        # Avis < 2 ans
FORENSIC_DATE_BEFORE_TOLERANCE_DAYS = 30
FORENSIC_DATE_AFTER_TOLERANCE_DAYS = 365

# Scoring
DOSSIER_SCORE_DOC_WEIGHT = 0.6       # 60% poids documents
DOSSIER_SCORE_CROSS_WEIGHT = 0.4     # 40% poids cross-validation
```

### 5.2 Prompts Gemini

Tous les prompts LLM sont en français avec réponse JSON stricte. Ils couvrent :
- OCR et extraction de texte (y compris MRZ)
- Classification parmi 13 types
- Extraction de personne (nom, prénom, date naissance)
- Extraction de montants (salaires, cumuls, taux PAS)
- Extraction d'adresse (rue, code postal, ville)
- Extraction de termes contractuels
- Matching de personnes (fuzzy)

### 5.3 Normalisation des données

- Noms : `UPPERCASE` via validateur Pydantic
- Prénoms : `Title Case` (Jean-Pierre)
- MRZ prioritaire sur Gemini pour l'identité
- Dates : format DD/MM/YYYY

### 5.4 Logique de détection de fraude

La **combinaison multi-signaux** est le coeur de la valeur :
1. Forensic (métadonnées PDF) → détection outils suspects
2. Cryptographique (MRZ, 2D-Doc, checksums) → détection altération
3. Mathématique (ratios, cumuls) → détection incohérences
4. Cross-documents (19 checks) → détection faux fabriqués indépendamment
5. Bases officielles (INSEE SIRET, barème PAS) → vérification réalité

---

## 6. Dette technique

### 6.1 Critique (bloquant production)

| # | Problème | Impact | Fichier(s) |
|---|----------|--------|-----------|
| 1 | **Stockage in-memory uniquement** | Toutes données perdues au redémarrage | `dossier_store.py` |
| 2 | **Aucune authentification** | Endpoints publics, n'importe qui accède aux dossiers | `main.py` |
| 3 | **CORS ouvert à `*`** | CSRF possibles, aucune protection cross-origin | `main.py` |
| 4 | **Zéro tests** | Aucun pytest, aucun fixture, aucune CI | — |
| 5 | **`pikepdf` absent de requirements.txt** | Import échoue si non installé manuellement | `forensic_service.py` |
| 6 | **Secrets hardcodés dans `.env`** | Clés API exposées si leak | `.env` |
| 7 | **Pas de rate limiting** | Vulnérable DDoS, overflow quotas API | — |
| 8 | **Pas de validation taille fichier** | Risque OOM sur gros fichiers | `routers/extract.py` |

### 6.2 Important (avant lancement)

| # | Problème | Impact |
|---|----------|--------|
| 9 | Versions non pinées dans `requirements.txt` | Updates peuvent casser le code |
| 10 | Pas de middleware erreur global | Réponses 500 non formatées |
| 11 | Pas de retry/backoff sur APIs externes | Timeouts INSEE/Brave non gérés |
| 12 | Pas de logging structuré / audit trail | Impossible d'auditer |
| 13 | **RGPD non respecté** — PII envoyées à Gemini sans DPA, pas de consentement, pas de rétention | Risque légal |
| 14 | Pas de HTTPS | Données en clair en transit |
| 15 | Frontend vanilla JS (1 382 lignes) | Maintenance difficile, pas de composants réutilisables |
| 16 | Panel debug LLM expose prompts + réponses | Fuite d'information en production |
| 17 | ~30 `print()` en code métier | Pollution logs, risque fuite secrets |

### 6.3 Souhaitable (post-MVP)

| # | Problème | Impact |
|---|----------|--------|
| 18 | Pas de monitoring (Sentry, Prometheus) | Erreurs prod invisibles |
| 19 | Pas de dashboard analytics | Stats fraude/usage non suivies |
| 20 | Pas d'export rapport PDF | Demande utilisateur fréquente |
| 21 | Pas de cache OCR | Même fichier = nouveaux appels Gemini |
| 22 | Pas de tests de charge | Limites de scaling inconnues |
| 23 | Type hints incomplets sur certaines fonctions | Difficile pour mypy/pyright |

---

## 7. Features manquantes (non implémentées dans v1)

### Fonctionnel

- [ ] Base de données persistante
- [ ] Authentification utilisateur (inscription, connexion, gestion compte)
- [ ] Export rapport PDF professionnel
- [ ] Historique des analyses (consultable après redémarrage)
- [ ] Système de paiement (monétisation)
- [ ] Page de pricing / plans
- [ ] Landing page marketing
- [ ] Gestion multi-utilisateurs (isolation des dossiers)
- [ ] Notifications (email résultats, alertes fraude)
- [ ] Partage de rapport (lien sécurisé pour le bailleur)

### Technique

- [ ] Tests (unitaires, intégration, E2E)
- [ ] CI/CD (GitHub Actions)
- [ ] Dockerfile / docker-compose
- [ ] Logging structuré + audit trail
- [ ] Rate limiting
- [ ] HTTPS / TLS
- [ ] Monitoring / alerting (Sentry, Prometheus)
- [ ] Cache OCR (éviter appels Gemini redondants)
- [ ] Multi-environnement (dev/staging/prod)
- [ ] Versioning API (`/api/v1/`)

### Conformité

- [ ] RGPD : DPA Gemini, consentement, rétention, droit suppression
- [ ] Mentions légales + politique de confidentialité
- [ ] CGU / CGV
- [ ] Chiffrement au repos (PII)

---

## 8. Modèles de données à migrer

### Hiérarchie principale (Pydantic v2 → Supabase tables)

```
DossierCandidature (UUID)
├── created_at, status ("en_cours" | "complet" | "alerte")
└── candidats: Candidat[]
    ├── id (UUID), role ("locataire" | "co-locataire" | "garant")
    ├── nom, prenom, date_naissance (auto-remplis depuis docs)
    └── documents: DocumentDossier[]
        ├── filename, doc_type, classified_type, file_hash (SHA-256)
        ├── person: PersonExtraction
        │   ├── nom (UPPERCASE), prenom (Title Case)
        │   ├── date_naissance, sexe, nationalite
        │   ├── extraction_source ("mrz" | "gemini" | "filename")
        │   └── confidence (0.0-1.0)
        ├── analysis_date
        └── raw_result (dict complet)
            ├── validation: ValidationResult
            │   ├── checks: ValidationCheck[] (name, label, status, message, value)
            │   ├── confidence_score (0-100)
            │   ├── overall_status ("ok" | "warning" | "error")
            │   └── forensic, math_validation, company_check, twodoc, contract_terms
            └── cross_validation: CrossValidationResult
                ├── checks, overall_status, confidence_score
                ├── completeness (present, missing, score)
                └── summary
```

---

## 9. Résumé forces / faiblesses

### Forces

1. **Pipeline complet et fonctionnel** — 8 étapes, bien orchestrées
2. **Validation exhaustive** — 9 types de docs, 19 checks cross-validation
3. **Cryptographie solide** — MRZ ICAO 9303, 2D-Doc ECDSA, IBAN, SIRET, NIR
4. **Intégration LLM intelligente** — Gemini pour OCR, classification, extraction, matching
5. **Forensic pertinent** — Détection outils suspects, métadonnées
6. **Scoring multi-dimensionnel** — Pénalités pondérées, score dossier combiné
7. **Auto-routing candidats** — Matching LLM pour router les documents
8. **Seuils configurables** — `thresholds.py` bien centralisé (218 lignes)
9. **Modèles Pydantic stricts** — Type safety, validation automatique

### Faiblesses

1. **Zéro persistance** — Dict in-memory, tout perdu au redémarrage
2. **Aucune sécurité** — Pas d'auth, CORS `*`, pas de rate limiting
3. **Zéro tests** — Aucun test unitaire ni d'intégration
4. **RGPD absent** — PII non protégées, pas de DPA, pas de consentement
5. **Frontend non maintenable** — 1 382 lignes vanilla JS monolithiques
6. **Pas de monétisation** — Aucun système de paiement
7. **Pas de monitoring** — Erreurs silencieuses en production

---

## 10. Recommandations pour v2

### Conserver absolument

- La totalité de la logique métier des 8 étapes du pipeline
- Les 19 checks de cross-validation
- Les algorithmes cryptographiques (MRZ, 2D-Doc, IBAN, SIRET, NIR)
- Le système de scoring avec pénalités pondérées
- Les seuils configurables (`thresholds.py`)
- Les prompts Gemini (OCR, classification, extraction)
- L'analyse forensique des métadonnées PDF

### Réécrire

- Le frontend (vanilla JS → Next.js 15 + shadcn/ui)
- Le stockage (dict in-memory → Supabase PostgreSQL + RLS)
- L'API (FastAPI → Next.js API Routes / Server Actions)
- L'authentification (rien → Supabase Auth)
- Le streaming (SSE natif → possiblement Server Actions + streaming)

### Ajouter

- Base de données persistante (Supabase)
- Authentification + autorisation (Supabase Auth + RLS)
- Paiement (Stripe)
- Tests (Vitest + Testing Library)
- CI/CD (GitHub Actions)
- Monitoring (PostHog + Sentry)
- RGPD compliance
- Export rapport PDF
- Landing page marketing
- Dashboard utilisateur professionnel

### Migration de la logique métier

Le **backend Python** contient la logique d'analyse critique. Deux approches possibles :

1. **API Routes Next.js** : Réécrire les services en TypeScript (effort important mais stack unifiée)
2. **Microservice Python** : Garder le backend FastAPI en tant qu'API d'analyse, appelé par Next.js (migration incrémentale)

**Recommandation** : Approche hybride — garder le backend Python comme service d'analyse (les libs OCR/crypto sont matures en Python), consommé par le frontend Next.js via API interne.
