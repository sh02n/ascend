import { parseCsv } from "./csvParser.service.js";
import type { StoredImportDataset } from "./importStorage.service.js";

export type DatasetAnalysisResult = {
  datasetId: string;
  detectedDatasetType: string;
  confidence: number;
  entities: string[];
  summary: string;
};

type ColumnSignal = {
  name: string;
  normalized: string;
  samples: string[];
};

const datasetRules = [
  {
    type: "Marketplace Reviews",
    entities: ["Customer", "Product", "Review", "Rating", "Timestamp"],
    terms: ["customer", "user", "buyer", "product", "item", "rating", "review", "comment", "text"],
  },
  {
    type: "Transactions",
    entities: ["Customer", "Account", "Transaction", "Amount", "Timestamp"],
    terms: ["transaction", "account", "amount", "merchant", "payment", "balance", "currency"],
  },
  {
    type: "Claims",
    entities: ["Customer", "Policy", "Claim", "Amount", "Timestamp"],
    terms: ["claim", "policy", "adjuster", "incident", "coverage", "premium"],
  },
  {
    type: "Medical Records",
    entities: ["Patient", "Provider", "Encounter", "Procedure", "Timestamp"],
    terms: ["patient", "provider", "diagnosis", "procedure", "encounter", "medical", "clinic"],
  },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function isDateLike(value: string) {
  return /^\d{4}-\d{1,2}-\d{1,2}/.test(value) || /^\d{10,13}$/.test(value);
}

function buildColumnSignals(dataset: StoredImportDataset): ColumnSignal[] {
  const parsed = parseCsv(dataset.content);

  return parsed.headers.map((name, columnIndex) => ({
    name,
    normalized: normalize(name),
    samples: parsed.rows.slice(0, 20).map((row) => row[columnIndex] ?? ""),
  }));
}

function inferAdditionalEntities(columns: ColumnSignal[]) {
  const entities = new Set<string>();

  for (const column of columns) {
    const joined = `${column.normalized} ${column.samples.slice(0, 5).join(" ").toLowerCase()}`;

    if (/customer|user|buyer|client/.test(joined)) entities.add("Customer");
    if (/product|item|sku|asset/.test(joined)) entities.add("Product");
    if (/review|comment|feedback|message|text/.test(joined)) entities.add("Review");
    if (/rating|score|stars/.test(joined)) entities.add("Rating");
    if (/time|date|created|updated|timestamp/.test(joined) || column.samples.some(isDateLike)) entities.add("Timestamp");
    if (/transaction|payment|transfer|order/.test(joined)) entities.add("Transaction");
    if (/amount|price|total|balance/.test(joined)) entities.add("Amount");
    if (/claim|policy|coverage/.test(joined)) entities.add("Claim");
    if (/patient|member/.test(joined)) entities.add("Patient");
    if (/provider|doctor|clinician|facility/.test(joined)) entities.add("Provider");
  }

  return [...entities];
}

export function analyzeDataset(dataset: StoredImportDataset): DatasetAnalysisResult {
  const columns = buildColumnSignals(dataset);
  const columnText = columns.map((column) => column.normalized).join(" ");
  const scoredRules = datasetRules.map((rule) => {
    const matches = rule.terms.filter((term) => columnText.includes(term)).length;
    return { ...rule, matches };
  });
  const bestRule = scoredRules.sort((left, right) => right.matches - left.matches)[0];
  const inferredEntities = inferAdditionalEntities(columns);
  const detectedDatasetType = bestRule && bestRule.matches > 0 ? bestRule.type : "Unknown";
  const entities = inferredEntities.length > 0 ? inferredEntities : bestRule?.entities ?? [];
  const confidence = detectedDatasetType === "Unknown" ? 42 : Math.min(98, 60 + bestRule.matches * 8 + entities.length * 2);

  const entityText = entities.length > 0 ? entities.join(", ").toLowerCase() : "general records";
  const summary =
    detectedDatasetType === "Unknown"
      ? "This dataset does not strongly match a known sector pattern yet. The pipeline can still profile fields and prepare generic mappings for review."
      : `This dataset appears to contain ${detectedDatasetType.toLowerCase()} activity. The dataset includes ${entityText} signals based on column names and sample values.`;

  return {
    datasetId: dataset.id,
    detectedDatasetType,
    confidence,
    entities,
    summary,
  };
}
