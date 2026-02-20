# Requirements — DossierSûr v2

## Problème

La fraude documentaire dans les dossiers locatifs en France est une épidémie :
- **10% des dossiers** contiennent des documents falsifiés (2025)
- **1 dossier sur 4** est frauduleux en Île-de-France (Finovox)
- Les **bulletins de paie** sont le document le plus falsifié
- Un **pack frauduleux complet se vend ~180 €** en ligne
- Les deepfakes ont augmenté de **700% depuis 2023** en France

Les solutions existantes sont inadaptées :
- **DossierFacile** : ne vérifie que CNI + avis d'imposition, ne certifie pas l'authenticité
- **Vialink / Finovox** : B2B uniquement, pricing opaque, inaccessible aux particuliers
- **Visale** : garantie loyer mais ne vérifie pas les documents sources
- **Vérification manuelle** : appels employeurs (violation RGPD), intuition

## Utilisateurs cibles

### Persona principal : Bailleur particulier
- **3,5 millions de bailleurs particuliers** en France (segment sous-équipé)
- Propriétaires de petits portefeuilles (1-3 biens)
- Non-techniques, cherchent une vérification **instantanée et compréhensible**
- Modèle préféré : **paiement à l'usage** (pas d'abonnement obligatoire)
- Pain principal : peur du faux dossier, pas de moyen fiable de vérifier

### Persona secondaire : Agence immobilière / Gestionnaire
- Volume plus élevé (dizaines de dossiers/mois)
- Besoin d'un **dashboard multi-dossiers** avec historique
- Modèle préféré : abonnement mensuel avec volume inclus
- Pain : temps perdu en vérification manuelle, responsabilité en cas de fraude

## Objectifs business

- **MRR cible 6 mois** : 5 000 €
- **Utilisateurs actifs** : 500 bailleurs, 20 agences
- **Analyses/mois** : 2 000 dossiers
- **Timeline MVP** : 8 semaines

## Features MVP

### Authentification et gestion de compte
- [ ] Inscription email + OAuth Google
- [ ] Connexion / déconnexion
- [ ] Page profil utilisateur
- [ ] Mot de passe oublié / reset

### Pipeline d'analyse documentaire (portage v1)
- [ ] Upload multi-fichiers (drag & drop, PDF + images)
- [ ] Pipeline 8 étapes avec résultats temps réel (streaming)
- [ ] Classification automatique (13 types de documents)
- [ ] Validation par type (9 types avec checks spécialisés) :
  - Bulletin de paie (ratio net/brut, cumuls, NIR, SIRET, PAS, forensic)
  - CNI / Passeport / Titre de séjour (MRZ ICAO 9303, 2D-Doc ECDSA)
  - Avis d'imposition (n° fiscal, 2D-Doc, RFR)
  - Justificatif de domicile (date < 3 mois, fournisseur connu)
  - Contrat de travail (CDI/CDD, SIRET, termes)
  - Attestation employeur (SIRET, date < 3 mois)
  - RIB (IBAN checksum, BIC)
  - Quittance de loyer (montant, date, bailleur)
  - Relevé de compte (IBAN, titulaire)
- [ ] Cross-validation inter-documents (19 checks)
- [ ] Scoring document (0-100) + scoring dossier (0-100)
- [ ] Analyse forensique des métadonnées PDF
- [ ] Vérifications cryptographiques (MRZ, 2D-Doc, IBAN, SIRET, NIR)

### Gestion des dossiers
- [ ] CRUD dossier / candidat / document
- [ ] Auto-routing documents vers le bon candidat
- [ ] Détection doublons (SHA-256)
- [ ] Historique des analyses (persistant)
- [ ] Statut dossier : en cours / complet / alerte

### Dashboard utilisateur
- [ ] Liste des dossiers avec statut et score
- [ ] Vue détaillée d'un dossier (candidats, documents, checks)
- [ ] Résumé visuel des alertes (rouge/orange/vert)
- [ ] Rechargement du rapport

### Paiement
- [ ] Pricing page (3 plans)
- [ ] Stripe Checkout
- [ ] Webhook Stripe (paiement, abonnement, annulation)
- [ ] Compteur d'analyses restantes (plans à l'usage)
- [ ] Paywall avant analyse si crédit épuisé

### Landing page
- [ ] Hero avec proposition de valeur
- [ ] Section problème / solution
- [ ] Démonstration visuelle (avant/après)
- [ ] Pricing
- [ ] FAQ
- [ ] Footer légal (mentions légales, CGU, politique de confidentialité)

## Features V2 (post-MVP)

- [ ] Export rapport PDF professionnel (téléchargeable, partageable)
- [ ] Lien de partage sécurisé (bailleur envoie au locataire pour upload)
- [ ] Notifications email (rapport prêt, alerte fraude détectée)
- [ ] Dashboard agence (multi-utilisateurs, rôles, volume)
- [ ] API publique (pour intégrateurs)
- [ ] Cache OCR intelligent (éviter appels Gemini redondants)
- [ ] Barème PAS dynamique (mise à jour annuelle automatique)
- [ ] Support documents supplémentaires (Kbis, bilans, etc.)
- [ ] Mode comparaison multi-candidats
- [ ] Onboarding guidé (première analyse accompagnée)

## Ce qu'on ne fait PAS (out of scope)

- **Pas de DossierFacile** : on ne constitue pas le dossier, on le vérifie
- **Pas de garantie loyer** (type Visale) : on détecte la fraude, on ne couvre pas le risque
- **Pas de stockage long terme des documents** : les PDFs sont analysés puis supprimés (RGPD)
- **Pas de vérification d'identité biométrique** (FranceConnect, selfie) : hors scope MVP
- **Pas de marketplace** : on ne met pas en relation bailleur/locataire
- **Pas d'IA générative** : on n'aide pas à créer des documents (éthique)
- **Pas de multi-langue** : France uniquement, interface en français

## Contraintes

### Techniques
- Le pipeline d'analyse (Python) reste en backend séparé (libs OCR/crypto matures en Python)
- Next.js consomme l'API Python via appels internes
- 3-6 appels Gemini par document (~5-15s de latence par document)
- Rendering PDF à 200 DPI (compromis qualité/coût)
- Fichiers acceptés : PDF, JPG, PNG, WEBP, BMP, TIFF, HEIC

### Légales / RGPD
- Documents envoyés à Google Gemini → DPA obligatoire
- PII (noms, IBAN, NIR, dates de naissance) → chiffrement au repos
- Droit de suppression fonctionnel
- Consentement explicite avant analyse
- Politique de rétention : suppression des fichiers uploadés après analyse
- Conservation résultats d'analyse : 12 mois max
- Mentions légales + CGU + politique de confidentialité obligatoires
- PostHog : pas de PII dans les events, IP anonymisée

### Sécurité
- Supabase RLS sur toutes les tables (isolation multi-tenant)
- Middleware auth sur toutes les routes protégées
- Rate limiting API (par utilisateur + par IP)
- Validation taille fichier (max 20 MB par fichier)
- CORS restreint aux domaines autorisés
- HTTPS obligatoire (Vercel)
- Service role key jamais exposée client-side

### Budget
- Coût Gemini API : ~0,01-0,05 € par document (Flash)
- Coût INSEE API : gratuit (quota limité)
- Supabase : plan gratuit pour MVP, Pro (~25 €/mois) en production
- Vercel : plan gratuit pour MVP, Pro (~20 €/mois) en production
- Stripe : 1,4% + 0,25 € par transaction (Europe)

## Critères de succès

- **Taux de détection** : >90% des fraudes connues détectées sur un jeu de test
- **Faux positifs** : <5% de documents légitimes signalés comme suspects
- **Temps d'analyse** : <30 secondes par document, <2 minutes par dossier complet
- **Conversion** : >10% des visiteurs landing → inscription
- **Activation** : >50% des inscrits analysent au moins 1 dossier
- **Rétention** : >30% des utilisateurs reviennent dans les 30 jours
- **NPS** : >40 après 3 mois
- **Uptime** : >99,5%
