import { apiClient } from "../../../../core/api/apiClient";

export type ImportSessionResponse = {
  message: string;
  data: {
    id: string;
    sector: string;
    status: string;
  };
};

export type ImportUploadResponse = {
  message: string;
  data: {
    id: string;
    sessionId: string;
    filename: string;
    filesize: number;
    sourceType: string;
    status: string;
  };
};

export type DatasetProfile = {
  datasetId: string;
  datasetName: string;
  fileType: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  headers: string[];
  previewRows: Record<string, string>[];
};

export type ValidationReport = {
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

export type DatasetAnalysis = {
  datasetId: string;
  detectedDatasetType: string;
  confidence: number;
  entities: string[];
  summary: string;
};

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
  records: Array<{
    metadata: {
      source_row_index: string;
      original_values: Record<string, string | null>;
    };
    values: Record<string, string | null>;
  }>;
  export: {
    filename: string;
    mimeType: string;
    csvContent: string;
  };
  generatedAt: string;
};

export type ImportStatus = {
  sessionId: string;
  status: string;
  datasetId?: string;
  updatedAt: string;
  steps: Array<{
    label: string;
    status: string;
    timestamp: string;
  }>;
};

export async function createImportSession() {
  return apiClient<ImportSessionResponse>("/import/session", {
    method: "POST",
    body: JSON.stringify({ sector: "marketplace" }),
  });
}

export async function uploadImportFile(sessionId: string, file: File) {
  return apiClient<ImportUploadResponse>("/import/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "x-import-session-id": sessionId,
      "x-import-filename": encodeURIComponent(file.name),
      "x-import-filesize": String(file.size),
      "x-import-mimetype": file.type || "application/octet-stream",
      "x-import-source-type": file.name.toLowerCase().endsWith(".json") ? "json" : "csv",
    },
    body: file,
  });
}

export async function profileImportedDataset(datasetId: string) {
  return apiClient<{ message: string; data: DatasetProfile }>("/import/profile", {
    method: "POST",
    body: JSON.stringify({ datasetId }),
  });
}

export async function validateImportedDataset(datasetId: string) {
  return apiClient<{ message: string; data: ValidationReport }>("/import/validate", {
    method: "POST",
    body: JSON.stringify({ datasetId }),
  });
}

export async function analyseImportedDataset(datasetId: string) {
  return apiClient<{ message: string; data: DatasetAnalysis }>("/import/analyse", {
    method: "POST",
    body: JSON.stringify({ datasetId }),
  });
}

export async function mapImportedDataset(
  datasetId: string,
  overrides: Array<{ sourceField: string; targetField: string }> = [],
) {
  return apiClient<{ message: string; data: FieldMappingResult }>("/import/map", {
    method: "POST",
    body: JSON.stringify({ datasetId, overrides }),
  });
}

export async function transformImportedDataset(sessionId: string, datasetId: string) {
  return apiClient<{ message: string; data: InvestigationDatasetResult }>("/import/transform", {
    method: "POST",
    body: JSON.stringify({ sessionId, datasetId }),
  });
}

export async function getImportStatus(sessionId: string) {
  return apiClient<{ message: string; data: ImportStatus }>(`/import/status/${sessionId}`);
}
