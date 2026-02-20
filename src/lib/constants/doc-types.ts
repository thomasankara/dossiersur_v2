export const DOC_TYPE_VALUES = [
  "cni",
  "passeport",
  "titre_sejour",
  "avis_imposition",
  "bulletin_salaire",
  "attestation_employeur",
  "contrat_travail",
  "quittance_loyer",
  "justificatif_domicile",
  "rib",
  "kbis",
  "autre",
] as const;

export type DocTypeValue = (typeof DOC_TYPE_VALUES)[number];

export const DOC_TYPE_OPTIONS: { value: DocTypeValue; label: string }[] = [
  { value: "cni", label: "Carte d'identité" },
  { value: "passeport", label: "Passeport" },
  { value: "titre_sejour", label: "Titre de séjour" },
  { value: "avis_imposition", label: "Avis d'imposition" },
  { value: "bulletin_salaire", label: "Bulletin de salaire" },
  { value: "attestation_employeur", label: "Attestation employeur" },
  { value: "contrat_travail", label: "Contrat de travail" },
  { value: "quittance_loyer", label: "Quittance de loyer" },
  { value: "justificatif_domicile", label: "Justificatif de domicile" },
  { value: "rib", label: "RIB" },
  { value: "kbis", label: "K-bis" },
  { value: "autre", label: "Autre" },
];

export const DOC_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DOC_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);
