import { parseCsv } from "./csvParser.service.js";
import type { StoredImportDataset } from "./importStorage.service.js";

export type ValidationReportResult = {
  datasetId: string;
  totalRows: number;
  totalColumns: number;
  missingValues: number;
  duplicateRows: number;
  emptyCells: number;
  qualityScore: number;
  qualityLabel: string;
  summary: string;
};

function qualityLabel(score: number) {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 75) {
    return "Good";
  }

  if (score >= 60) {
    return "Needs Review";
  }

  return "Poor";
}

export function validateDataset(dataset: StoredImportDataset): ValidationReportResult {
  const parsed = parseCsv(dataset.content);
  const rowSignatures = new Set<string>();
  let duplicateRows = 0;
  let emptyCells = 0;

  for (const row of parsed.rows) {
    const normalizedRow = parsed.headers.map((_, index) => row[index] ?? "");
    const signature = JSON.stringify(normalizedRow);

    if (rowSignatures.has(signature)) {
      duplicateRows += 1;
    } else {
      rowSignatures.add(signature);
    }

    for (const cell of normalizedRow) {
      if (cell.trim().length === 0) {
        emptyCells += 1;
      }
    }
  }

  const totalCells = Math.max(parsed.rows.length * parsed.headers.length, 1);
  const missingRate = emptyCells / totalCells;
  const duplicateRate = parsed.rows.length > 0 ? duplicateRows / parsed.rows.length : 0;
  const qualityScore = Math.max(0, Math.round(100 - missingRate * 70 - duplicateRate * 30));

  return {
    datasetId: dataset.id,
    totalRows: parsed.rows.length,
    totalColumns: parsed.headers.length,
    missingValues: emptyCells,
    duplicateRows,
    emptyCells,
    qualityScore,
    qualityLabel: qualityLabel(qualityScore),
    summary: `${parsed.rows.length} rows and ${parsed.headers.length} columns validated.`,
  };
}
