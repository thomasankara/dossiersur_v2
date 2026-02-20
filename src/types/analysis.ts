// Types miroir de l'API Python d'analyse documentaire

export interface AnalyzeRequest {
  document_url: string;
  document_type: string;
  filename: string;
}

export interface AnalyzeResponse {
  classified_type: string;
  confidence_score: number;
  overall_status: "ok" | "warning" | "error";
  person: AnalysisPerson | null;
  checks: AnalysisCheck[];
  forensic: AnalysisForensic | null;
}

export interface AnalysisPerson {
  nom: string | null;
  prenom: string | null;
  date_naissance: string | null;
  source: string | null;
  confidence: number | null;
}

export interface AnalysisCheck {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  details: string | null;
}

export interface AnalysisForensic {
  metadata_present: boolean;
  producer: string | null;
  creator: string | null;
  creation_date: string | null;
  modification_date: string | null;
  tool_detected: string | null;
  suspicious_tools: string[];
  font_analysis: AnalysisFontAnalysis | null;
}

export interface AnalysisFontAnalysis {
  fonts_found: string[];
  suspicious_fonts: string[];
  is_suspicious: boolean;
}

export interface CrossValidateRequest {
  documents: CrossValidateDocumentInput[];
}

export interface CrossValidateDocumentInput {
  document_id: string;
  classified_type: string;
  person: AnalysisPerson | null;
  checks: AnalysisCheck[];
}

export interface CrossValidateResponse {
  checks: CrossValidateCheck[];
  overall_status: "ok" | "warning" | "error";
  confidence_score: number;
  completeness: CrossValidateCompleteness | null;
  summary: string;
}

export interface CrossValidateCheck {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  documents_compared: string[];
}

export interface CrossValidateCompleteness {
  required_types: string[];
  present_types: string[];
  missing_types: string[];
  score: number;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  version: string;
}
