import { parseCsv } from "./csvParser.service.js";
import type { StoredImportDataset } from "./importStorage.service.js";

export type FieldMappingSuggestion = {
  sourceField: string;
  targetField: string;
  confidence: number;
  status: "auto_mapped" | "user_modified";
};

export type FieldMappingResult = {
  datasetId: string;
  mappings: FieldMappingSuggestion[];
};

export type FieldMappingOverride = {
  sourceField: string;
  targetField: string;
};

const canonicalTargets = [
  { target: "customer_id", terms: ["customer", "user", "buyer", "client", "member"] },
  { target: "product_id", terms: ["product", "item", "sku", "asset"] },
  { target: "review_id", terms: ["review_id", "feedback_id", "comment_id"] },
  { target: "review_text", terms: ["review", "comment", "feedback", "message", "text", "description"] },
  { target: "rating", terms: ["rating", "score", "stars", "rank"] },
  { target: "timestamp", terms: ["timestamp", "time", "date", "created", "updated"] },
  { target: "transaction_id", terms: ["transaction", "payment", "transfer", "order"] },
  { target: "amount", terms: ["amount", "price", "total", "balance", "cost"] },
  { target: "claim_id", terms: ["claim"] },
  { target: "policy_id", terms: ["policy"] },
  { target: "patient_id", terms: ["patient"] },
  { target: "provider_id", terms: ["provider", "doctor", "clinician", "facility"] },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function suggestTarget(sourceField: string) {
  const normalized = normalize(sourceField);
  let bestTarget = normalized || "unmapped_field";
  let bestConfidence = 55;

  for (const candidate of canonicalTargets) {
    for (const term of candidate.terms) {
      if (normalized === term || normalized.includes(term)) {
        const confidence = normalized === term || normalized === candidate.target ? 96 : 84;
        if (confidence > bestConfidence) {
          bestTarget = candidate.target;
          bestConfidence = confidence;
        }
      }
    }
  }

  return { targetField: bestTarget, confidence: bestConfidence };
}

export function createFieldMappings(
  dataset: StoredImportDataset,
  overrides: FieldMappingOverride[] = [],
): FieldMappingResult {
  const parsed = parseCsv(dataset.content);
  const overrideMap = new Map(overrides.map((override) => [override.sourceField, override.targetField]));

  const mappings = parsed.headers.map<FieldMappingSuggestion>((sourceField) => {
    const suggested = suggestTarget(sourceField);
    const override = overrideMap.get(sourceField);

    return {
      sourceField,
      targetField: override ?? suggested.targetField,
      confidence: override ? 100 : suggested.confidence,
      status: override ? "user_modified" : "auto_mapped",
    };
  });

  return {
    datasetId: dataset.id,
    mappings,
  };
}
