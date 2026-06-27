const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

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

export async function createImportSession() {
  const response = await fetch(`${API_BASE_URL}/import/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sector: "marketplace" }),
  });

  if (!response.ok) {
    throw new Error(`Session request failed with status ${response.status}`);
  }

  return response.json() as Promise<ImportSessionResponse>;
}

export async function uploadImportFile(sessionId: string, file: File) {
  const response = await fetch(`${API_BASE_URL}/import/upload`, {
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

  if (!response.ok) {
    throw new Error(`Upload request failed with status ${response.status}`);
  }

  return response.json() as Promise<ImportUploadResponse>;
}

export async function uploadDemoDataset(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/import/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      sourceType: "demo",
      filename: "amazon_reviews_demo.csv",
    }),
  });

  if (!response.ok) {
    throw new Error(`Demo dataset request failed with status ${response.status}`);
  }

  return response.json() as Promise<ImportUploadResponse>;
}

export async function profileImportedDataset(datasetId: string) {
  const response = await fetch(`${API_BASE_URL}/import/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId }),
  });

  if (!response.ok) {
    throw new Error(`Profile request failed with status ${response.status}`);
  }

  return response.json() as Promise<{ message: string; data: DatasetProfile }>;
}

export async function validateImportedDataset(datasetId: string) {
  const response = await fetch(`${API_BASE_URL}/import/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId }),
  });

  if (!response.ok) {
    throw new Error(`Validation request failed with status ${response.status}`);
  }

  return response.json() as Promise<{ message: string; data: ValidationReport }>;
}

export async function analyseImportedDataset(datasetId: string) {
  const response = await fetch(`${API_BASE_URL}/import/analyse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId }),
  });

  if (!response.ok) {
    throw new Error(`Analysis request failed with status ${response.status}`);
  }

  return response.json() as Promise<{ message: string; data: DatasetAnalysis }>;
}

export async function mapImportedDataset(
  datasetId: string,
  overrides: Array<{ sourceField: string; targetField: string }> = [],
) {
  const response = await fetch(`${API_BASE_URL}/import/map`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId, overrides }),
  });

  if (!response.ok) {
    throw new Error(`Mapping request failed with status ${response.status}`);
  }

  return response.json() as Promise<{ message: string; data: FieldMappingResult }>;
}
export async function transformImportedDataset(sessionId: string, datasetId: string) {
  const response = await fetch(`${API_BASE_URL}/import/transform`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, datasetId }),
  });

  if (!response.ok) {
    throw new Error(`Transform request failed with status ${response.status}`);
  }

  return response.json() as Promise<{ message: string; data: InvestigationDatasetResult }>;
}

export async function getImportStatus(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/import/status/${sessionId}`);

  if (!response.ok) {
    throw new Error(`Status request failed with status ${response.status}`);
  }

  return response.json() as Promise<{ message: string; data: ImportStatus }>;
}



