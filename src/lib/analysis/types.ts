import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schemas for validating Python API responses
// ---------------------------------------------------------------------------

const analysisCheckSchema = z.object({
  name: z.string(),
  status: z.enum(["ok", "warning", "error"]),
  message: z.string(),
  details: z.string().nullable(),
});

const analysisFontSchema = z.object({
  fonts_found: z.array(z.string()),
  suspicious_fonts: z.array(z.string()),
  is_suspicious: z.boolean(),
});

const analysisForensicSchema = z.object({
  metadata_present: z.boolean(),
  producer: z.string().nullable(),
  creator: z.string().nullable(),
  creation_date: z.string().nullable(),
  modification_date: z.string().nullable(),
  tool_detected: z.string().nullable(),
  suspicious_tools: z.array(z.string()),
  font_analysis: analysisFontSchema.nullable(),
});

const analysisPersonSchema = z.object({
  nom: z.string().nullable(),
  prenom: z.string().nullable(),
  date_naissance: z.string().nullable(),
  source: z.string().nullable(),
  confidence: z.number().nullable(),
});

export const analyzeResponseSchema = z.object({
  classified_type: z.string(),
  confidence_score: z.number().int().min(0).max(100),
  overall_status: z.enum(["ok", "warning", "error"]),
  person: analysisPersonSchema.nullable(),
  checks: z.array(analysisCheckSchema),
  forensic: analysisForensicSchema.nullable(),
});

const crossValidateCheckSchema = z.object({
  name: z.string(),
  status: z.enum(["ok", "warning", "error"]),
  message: z.string(),
  documents_compared: z.array(z.string()),
});

const crossValidateCompletenessSchema = z.object({
  required_types: z.array(z.string()),
  present_types: z.array(z.string()),
  missing_types: z.array(z.string()),
  score: z.number().int().min(0).max(100),
});

export const crossValidateResponseSchema = z.object({
  checks: z.array(crossValidateCheckSchema),
  overall_status: z.enum(["ok", "warning", "error"]),
  confidence_score: z.number().int().min(0).max(100),
  completeness: crossValidateCompletenessSchema.nullable(),
  summary: z.string(),
});

export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]),
  version: z.string(),
});
