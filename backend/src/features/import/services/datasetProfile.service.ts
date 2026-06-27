import { parseCsv } from "./csvParser.service.js";
import type { StoredImportDataset } from "./importStorage.service.js";

export type DatasetProfileResult = {
  datasetId: string;
  datasetName: string;
  fileType: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  headers: string[];
  previewRows: Record<string, string>[];
};

function fileTypeFromName(filename: string, sourceType: string) {
  const extension = filename.split(".").pop()?.toUpperCase();
  return extension || sourceType.toUpperCase();
}

export function createDatasetProfile(dataset: StoredImportDataset): DatasetProfileResult {
  const parsed = parseCsv(dataset.content);
  const previewRows = parsed.rows.slice(0, 10).map((row) =>
    parsed.headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = row[index] ?? "";
      return record;
    }, {}),
  );

  return {
    datasetId: dataset.id,
    datasetName: dataset.filename,
    fileType: fileTypeFromName(dataset.filename, dataset.sourceType),
    fileSize: dataset.filesize,
    rowCount: parsed.rows.length,
    columnCount: parsed.headers.length,
    headers: parsed.headers,
    previewRows,
  };
}
