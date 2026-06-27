export type StoredFieldMapping = {
  sourceField: string;
  targetField: string;
  confidence: number;
  status: "auto_mapped" | "user_modified";
};

export type StoredImportDataset = {
  id: string;
  sessionId: string;
  filename: string;
  filesize: number;
  mimetype?: string;
  sourceType: string;
  content: string;
};

export type ImportPipelineStatus = {
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

const datasets = new Map<string, StoredImportDataset>();
const mappings = new Map<string, StoredFieldMapping[]>();
const statuses = new Map<string, ImportPipelineStatus>();

function now() {
  return new Date().toISOString();
}

function ensureStatus(sessionId: string): ImportPipelineStatus {
  const existing = statuses.get(sessionId);
  if (existing) {
    return existing;
  }

  const created: ImportPipelineStatus = {
    sessionId,
    status: "created",
    updatedAt: now(),
    steps: [],
  };
  statuses.set(sessionId, created);
  return created;
}

export const importStorageService = {
  save(dataset: StoredImportDataset) {
    datasets.set(dataset.id, dataset);
    this.recordStep(dataset.sessionId, "Dataset uploaded", "completed", dataset.id);
  },

  find(datasetId: string) {
    return datasets.get(datasetId) ?? null;
  },

  saveMappings(datasetId: string, nextMappings: StoredFieldMapping[]) {
    mappings.set(datasetId, nextMappings);
  },

  findMappings(datasetId: string) {
    return mappings.get(datasetId) ?? null;
  },

  recordStep(sessionId: string, label: string, status: string, datasetId?: string) {
    const current = ensureStatus(sessionId);
    const existingStep = current.steps.find((step) => step.label === label);
    const timestamp = now();

    if (existingStep) {
      existingStep.status = status;
      existingStep.timestamp = timestamp;
    } else {
      current.steps.push({ label, status, timestamp });
    }

    current.status = status === "completed" ? label.toLowerCase().replaceAll(" ", "_") : status;
    current.datasetId = datasetId ?? current.datasetId;
    current.updatedAt = timestamp;
    statuses.set(sessionId, current);
    return current;
  },

  getStatus(sessionId: string): ImportPipelineStatus {
    return statuses.get(sessionId) ?? {
      sessionId,
      status: "not_started",
      updatedAt: now(),
      steps: [],
    };
  },
};
