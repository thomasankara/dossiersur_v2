// Types miroir du schema SQL (ds_* tables)

export type DossierStatus = "en_cours" | "complet" | "alerte";
export type CandidatRole = "locataire" | "garant";
export type DocumentStatus = "ok" | "warning" | "error";
export type CrossValidationStatus = "ok" | "warning" | "error";
export type BillingEventType = "analysis" | "purchase" | "subscription" | "refund";

// ---------------------------------------------------------------------------
// Row types (SELECT)
// ---------------------------------------------------------------------------

export interface DsProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  plan: string;
  credits_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface DsDossier {
  id: string;
  user_id: string;
  name: string | null;
  status: DossierStatus;
  overall_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface DsCandidat {
  id: string;
  dossier_id: string;
  role: CandidatRole;
  nom: string | null;
  prenom: string | null;
  date_naissance: string | null;
  created_at: string;
}

export interface DsDocument {
  id: string;
  candidat_id: string;
  dossier_id: string;
  filename: string;
  file_hash: string;
  doc_type: string;
  classified_type: string | null;
  confidence_score: number | null;
  overall_status: DocumentStatus | null;
  person: PersonExtraction | null;
  validation_result: ValidationResult | null;
  analysis_date: string;
  created_at: string;
}

export interface DsCrossValidation {
  id: string;
  candidat_id: string;
  dossier_id: string;
  checks: CrossValidationCheck[];
  overall_status: CrossValidationStatus;
  confidence_score: number;
  completeness: CompletenessInfo | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface DsBillingEvent {
  id: string;
  user_id: string;
  type: BillingEventType;
  stripe_event_id: string | null;
  plan: string | null;
  credits_added: number;
  amount_cents: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// JSONB sub-types
// ---------------------------------------------------------------------------

export interface PersonExtraction {
  nom: string | null;
  prenom: string | null;
  date_naissance: string | null;
  source: string | null;
  confidence: number | null;
}

export interface ValidationResult {
  checks: ValidationCheck[];
  overall_status: DocumentStatus;
  confidence_score: number;
  forensic: ForensicResult | null;
}

export interface ValidationCheck {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  details: string | null;
}

export interface ForensicResult {
  metadata_present: boolean;
  producer: string | null;
  creator: string | null;
  creation_date: string | null;
  modification_date: string | null;
  tool_detected: string | null;
  suspicious_tools: string[];
  font_analysis: FontAnalysis | null;
}

export interface FontAnalysis {
  fonts_found: string[];
  suspicious_fonts: string[];
  is_suspicious: boolean;
}

export interface CrossValidationCheck {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  documents_compared: string[];
}

export interface CompletenessInfo {
  required_types: string[];
  present_types: string[];
  missing_types: string[];
  score: number;
}

// ---------------------------------------------------------------------------
// Join types (queries with relations)
// ---------------------------------------------------------------------------

export interface DossierWithCounts extends DsDossier {
  candidats_count: number;
  documents_count: number;
}

export interface CandidatWithDocuments extends DsCandidat {
  documents: DsDocument[];
  cross_validation: DsCrossValidation | null;
}

export interface DossierWithDetails extends DsDossier {
  candidats: CandidatWithDocuments[];
}

// ---------------------------------------------------------------------------
// Insert types (for creating new rows)
// ---------------------------------------------------------------------------

export interface DsDossierInsert {
  user_id: string;
  name?: string | null;
}

export interface DsCandidatInsert {
  dossier_id: string;
  role: CandidatRole;
  nom?: string | null;
  prenom?: string | null;
}

export interface DsDocumentInsert {
  candidat_id: string;
  dossier_id: string;
  filename: string;
  file_hash: string;
  doc_type: string;
  classified_type?: string | null;
  confidence_score?: number | null;
  overall_status?: DocumentStatus | null;
  person?: PersonExtraction | null;
  validation_result?: ValidationResult | null;
}

export interface DsBillingEventInsert {
  user_id: string;
  type: BillingEventType;
  stripe_event_id?: string | null;
  plan?: string | null;
  credits_added?: number;
  amount_cents?: number | null;
  metadata?: Record<string, unknown> | null;
}
