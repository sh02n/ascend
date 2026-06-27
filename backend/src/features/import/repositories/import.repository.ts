import { randomUUID } from "node:crypto";
import { prisma } from "../../../db/prisma.js";
import type {
  CreateDatasetAnalysisInput,
  CreateDatasetProfileInput,
  CreateFieldMappingInput,
  CreateImportedDatasetInput,
  CreateImportSessionInput,
  CreateInvestigationDatasetInput,
  CreateTransformationLogInput,
  CreateValidationReportInput,
} from "../types/index.js";

const prismaClient = prisma as unknown as {
  importSession?: {
    create: (args: { data: CreateImportSessionInput & { status: string } }) => Promise<unknown>;
  };
  importedDataset?: {
    create: (args: { data: CreateImportedDatasetInput & { status: string } }) => Promise<unknown>;
  };
  datasetProfile?: {
    create: (args: { data: CreateDatasetProfileInput }) => Promise<unknown>;
  };
  validationReport?: {
    create: (args: { data: CreateValidationReportInput }) => Promise<unknown>;
  };
  datasetAnalysis?: {
    create: (args: { data: CreateDatasetAnalysisInput }) => Promise<unknown>;
  };
  fieldMapping?: {
    createMany: (args: { data: CreateFieldMappingInput[] }) => Promise<unknown>;
  };
  investigationDataset?: {
    create: (args: { data: CreateInvestigationDatasetInput }) => Promise<unknown>;
  };
  transformationLog?: {
    create: (args: { data: CreateTransformationLogInput }) => Promise<unknown>;
  };
};

function fallbackTimestamp() {
  return new Date().toISOString();
}

function fallbackRecord(input: Record<string, unknown>) {
  return {
    id: randomUUID(),
    ...input,
    createdAt: fallbackTimestamp(),
    updatedAt: fallbackTimestamp(),
  };
}

export const importRepository = {
  async createSession(input: CreateImportSessionInput) {
    const data = { ...input, status: "created" };

    if (prismaClient.importSession) {
      try {
        return await prismaClient.importSession.create({ data });
      } catch {
        // Phase 1 keeps the endpoint usable before migrations are applied.
      }
    }

    return fallbackRecord(data);
  },

  async createDataset(input: CreateImportedDatasetInput) {
    const data = { ...input, status: "uploaded" };

    if (prismaClient.importedDataset) {
      try {
        return await prismaClient.importedDataset.create({ data });
      } catch {
        // Phase 1 keeps the endpoint usable before migrations are applied.
      }
    }

    return fallbackRecord(data);
  },

  async createProfile(input: CreateDatasetProfileInput) {
    if (prismaClient.datasetProfile) {
      try {
        return await prismaClient.datasetProfile.create({ data: input });
      } catch {
        // Phase 2 keeps the endpoint usable before migrations are applied.
      }
    }

    return fallbackRecord(input);
  },

  async createValidationReport(input: CreateValidationReportInput) {
    if (prismaClient.validationReport) {
      try {
        return await prismaClient.validationReport.create({ data: input });
      } catch {
        // Phase 2 keeps the endpoint usable before migrations are applied.
      }
    }

    return fallbackRecord(input);
  },

  async createAnalysis(input: CreateDatasetAnalysisInput) {
    if (prismaClient.datasetAnalysis) {
      try {
        return await prismaClient.datasetAnalysis.create({ data: input });
      } catch {
        // Phase 3 keeps the endpoint usable before migrations are applied.
      }
    }

    return fallbackRecord(input);
  },

  async createFieldMappings(input: CreateFieldMappingInput[]) {
    if (prismaClient.fieldMapping) {
      try {
        return await prismaClient.fieldMapping.createMany({ data: input });
      } catch {
        // Phase 3 keeps the endpoint usable before migrations are applied.
      }
    }

    return input.map((mapping) => fallbackRecord(mapping));
  },

  async createInvestigationDataset(input: CreateInvestigationDatasetInput) {
    if (prismaClient.investigationDataset) {
      try {
        return await prismaClient.investigationDataset.create({ data: input });
      } catch {
        // Phase 4 keeps the endpoint usable before migrations are applied.
      }
    }

    return fallbackRecord(input);
  },

  async createTransformationLog(input: CreateTransformationLogInput) {
    if (prismaClient.transformationLog) {
      try {
        return await prismaClient.transformationLog.create({ data: input });
      } catch {
        // Phase 4 keeps the endpoint usable before migrations are applied.
      }
    }

    return fallbackRecord(input);
  },
};
