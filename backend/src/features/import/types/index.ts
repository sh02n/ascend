export type ImportSector = "marketplace" | "banking" | "healthcare" | "insurance";

export type ImportSourceType = "csv" | "json" | "demo";

export type CreateImportSessionInput = {
  sector: ImportSector;
};

export type CreateImportedDatasetInput = {
  sessionId: string;
  filename: string;
  filesize: number;
  mimetype?: string;
  sourceType: ImportSourceType;
};

export type CreateDatasetProfileInput = {
  datasetId: string;
  rowCount: number;
  columnCount: number;
  headersJson: string;
  previewRowsJson: string;
};

export type CreateValidationReportInput = {
  datasetId: string;
  rowCount: number;
  columnCount: number;
  missingValues: number;
  duplicateRows: number;
  emptyCells: number;
  qualityScore: number;
  summary: string;
};

export type CreateDatasetAnalysisInput = {
  datasetId: string;
  detectedDatasetType: string;
  confidence: number;
  entitiesJson: string;
  summary: string;
};

export type CreateFieldMappingInput = {
  datasetId: string;
  sourceField: string;
  targetField: string;
  confidence: number;
  status: string;
  userOverride?: string;
};

export type CreateInvestigationDatasetInput = {
  sessionId: string;
  datasetId: string;
  mappingVersion: string;
  recordCount: number;
  outputFormat: string;
  exportMetadataJson: string;
};

export type CreateTransformationLogInput = {
  sessionId: string;
  datasetId: string;
  step: string;
  status: string;
  message: string;
  metadataJson?: string;
};
