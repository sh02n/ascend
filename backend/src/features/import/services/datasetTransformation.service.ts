import { parseCsv } from "./csvParser.service.js";
import type { StoredFieldMapping, StoredImportDataset } from "./importStorage.service.js";

export type InvestigationDatasetMetadata = {
  source_row_index: string;
  original_values: Record<string, string | null>;
};

export type InvestigationDatasetRecord = {
  metadata: InvestigationDatasetMetadata;
  values: Record<string, string | null>;
};

export type InvestigationDatasetResult = {
  sessionId: string;
  datasetId: string;
  investigationDatasetId: string;
  datasetName: string;
  recordCount: number;
  mappedFields: string[];
  mappingVersion: string;
  transformationStatus: string;
  outputFormat: "json_csv";
  records: InvestigationDatasetRecord[];
  export: {
    filename: string;
    mimeType: string;
    csvContent: string;
  };
  generatedAt: string;
};

function csvEscape(value: string | null) {
  if (value === null) {
    return "";
  }

  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function normalizedField(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unmapped_field";
}

function buildOriginalRecord(headers: string[], row: string[]) {
  return headers.reduce<Record<string, string | null>>((record, header, index) => {
    const value = row[index] ?? "";
    record[header] = value.length > 0 ? value : null;
    return record;
  }, {});
}

function buildCsv(records: InvestigationDatasetRecord[], mappedFields: string[]) {
  const headers = [...mappedFields, "metadata"];
  const lines = [headers.join(",")];

  for (const record of records) {
    lines.push(
      headers
        .map((header) => {
          if (header === "metadata") {
            return csvEscape(JSON.stringify(record.metadata));
          }

          return csvEscape(record.values[header] ?? null);
        })
        .join(","),
    );
  }

  return lines.join("\n");
}

export function transformDataset(
  dataset: StoredImportDataset,
  mappings: StoredFieldMapping[],
): InvestigationDatasetResult {
  const parsed = parseCsv(dataset.content);
  const activeMappings = mappings.map((mapping) => ({
    ...mapping,
    targetField: normalizedField(mapping.targetField),
  }));
  const mappedFields = [...new Set(activeMappings.map((mapping) => mapping.targetField))];

  const records = parsed.rows.map<InvestigationDatasetRecord>((row, rowIndex) => {
    const original = buildOriginalRecord(parsed.headers, row);
    const values = mappedFields.reduce<Record<string, string | null>>((current, field) => {
      current[field] = null;
      return current;
    }, {});

    for (const mapping of activeMappings) {
      const sourceIndex = parsed.headers.indexOf(mapping.sourceField);
      const value = sourceIndex >= 0 ? row[sourceIndex] ?? "" : "";
      values[mapping.targetField] = value.length > 0 ? value : null;
    }

    return {
      values,
      metadata: {
        source_row_index: String(rowIndex + 1),
        original_values: original,
      },
    };
  });

  const generatedAt = new Date().toISOString();
  const mappingVersion = `mapping-${generatedAt}`;
  const filename = `${dataset.filename.replace(/\.[^.]+$/, "")}_investigation_dataset.csv`;

  return {
    sessionId: dataset.sessionId,
    datasetId: dataset.id,
    investigationDatasetId: `investigation_${dataset.id}`,
    datasetName: dataset.filename,
    recordCount: records.length,
    mappedFields,
    mappingVersion,
    transformationStatus: "ready_for_investigation",
    outputFormat: "json_csv",
    records,
    export: {
      filename,
      mimeType: "text/csv",
      csvContent: buildCsv(records, mappedFields),
    },
    generatedAt,
  };
}
