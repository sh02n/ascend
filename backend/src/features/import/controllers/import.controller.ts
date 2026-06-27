import type { Request, Response } from "express";
import { importRepository } from "../repositories/import.repository.js";
import { analyzeDataset } from "../services/datasetAnalysis.service.js";
import { createDatasetProfile } from "../services/datasetProfile.service.js";
import { transformDataset } from "../services/datasetTransformation.service.js";
import { validateDataset } from "../services/datasetValidation.service.js";
import { createFieldMappings, type FieldMappingOverride } from "../services/fieldMapping.service.js";
import { importStorageService, type StoredImportDataset } from "../services/importStorage.service.js";
import type { ImportSector, ImportSourceType } from "../types/index.js";

const supportedSectors = new Set(["marketplace", "banking", "healthcare", "insurance"]);
const supportedSourceTypes = new Set(["csv", "json", "demo"]);

const demoCsv = `review_id,customer_id,product_id,rating,review_text,review_date
r-1001,c-204,p-884,5,"Fast delivery and accurate listing.",2024-01-12
r-1002,c-982,p-144,1,"Repeated review text from suspicious account.",2024-01-13
r-1003,c-204,p-884,5,"Fast delivery and accurate listing.",2024-01-12
r-1004,c-552,p-621,4,"Product matched expectations.",2024-01-14
r-1005,c-811,p-144,,"Missing rating should be detected.",2024-01-15
r-1006,c-612,p-455,2,,2024-01-16
r-1007,c-331,p-884,5,"Helpful seller and clear packaging.",2024-01-17
r-1008,c-982,p-144,1,"Repeated review text from suspicious account.",2024-01-13`;

type DatasetLookup = {
  datasetId: string;
  dataset: StoredImportDataset | null;
};

function normalizeSector(value: unknown): ImportSector {
  return typeof value === "string" && supportedSectors.has(value)
    ? (value as ImportSector)
    : "marketplace";
}

function normalizeSourceType(value: unknown): ImportSourceType {
  return typeof value === "string" && supportedSourceTypes.has(value)
    ? (value as ImportSourceType)
    : "csv";
}

function headerValue(req: Request, name: string) {
  const value = req.header(name);
  return value ? decodeURIComponent(value) : undefined;
}

function idFromRecord(record: unknown) {
  return typeof record === "object" && record !== null && "id" in record
    ? String((record as { id: unknown }).id)
    : "";
}

function bodyRecord(req: Request) {
  return req.body && !Buffer.isBuffer(req.body) ? (req.body as Record<string, unknown>) : {};
}

function datasetFromRequest(req: Request): DatasetLookup {
  const datasetId = String(req.body?.datasetId ?? "").trim();
  return { datasetId, dataset: datasetId ? importStorageService.find(datasetId) : null };
}

function sendDatasetError(res: Response, lookup: DatasetLookup) {
  if (!lookup.datasetId) {
    res.status(400).json({ message: "datasetId is required" });
    return true;
  }

  if (!lookup.dataset) {
    res.status(404).json({ message: "Imported dataset not found" });
    return true;
  }

  return false;
}

function mappingOverrides(value: unknown): FieldMappingOverride[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }

    const sourceField = String((item as { sourceField?: unknown }).sourceField ?? "").trim();
    const targetField = String((item as { targetField?: unknown }).targetField ?? "").trim();

    return sourceField && targetField ? [{ sourceField, targetField }] : [];
  });
}

export const importController = {
  async createSession(req: Request, res: Response) {
    const sector = normalizeSector(req.body?.sector);
    const session = await importRepository.createSession({ sector });

    res.status(201).json({
      message: "Import session created",
      data: session,
    });
  },

  async uploadDataset(req: Request, res: Response) {
    const body = bodyRecord(req);
    const sessionId = (headerValue(req, "x-import-session-id") ?? String(body.sessionId ?? "")).trim();

    if (!sessionId) {
      res.status(400).json({ message: "sessionId is required" });
      return;
    }

    const sourceType = normalizeSourceType(headerValue(req, "x-import-source-type") ?? body.sourceType);
    const filename =
      headerValue(req, "x-import-filename") ??
      String(body.filename ?? (sourceType === "demo" ? "amazon_reviews_demo.csv" : "dataset.csv"));
    const content = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(body.content ?? demoCsv);
    const filesize = Number(headerValue(req, "x-import-filesize") ?? body.filesize ?? Buffer.byteLength(content));
    const mimetype = headerValue(req, "x-import-mimetype") ?? String(body.mimetype ?? "text/csv");

    if (!content.trim()) {
      res.status(400).json({ message: "Uploaded dataset is empty" });
      return;
    }

    const dataset = await importRepository.createDataset({
      sessionId,
      filename,
      filesize,
      mimetype,
      sourceType,
    });
    const datasetId = idFromRecord(dataset);

    importStorageService.save({
      id: datasetId,
      sessionId,
      filename,
      filesize,
      mimetype,
      sourceType,
      content,
    });

    res.status(201).json({
      message: "Dataset upload metadata saved",
      data: dataset,
    });
  },

  async profileDataset(req: Request, res: Response) {
    const lookup = datasetFromRequest(req);
    if (sendDatasetError(res, lookup) || !lookup.dataset) return;

    const profile = createDatasetProfile(lookup.dataset);
    await importRepository.createProfile({
      datasetId: lookup.datasetId,
      rowCount: profile.rowCount,
      columnCount: profile.columnCount,
      headersJson: JSON.stringify(profile.headers),
      previewRowsJson: JSON.stringify(profile.previewRows),
    });
    importStorageService.recordStep(lookup.dataset.sessionId, "CSV parsed", "completed", lookup.datasetId);

    res.status(200).json({
      message: "Dataset profile generated",
      data: profile,
    });
  },

  async validateDataset(req: Request, res: Response) {
    const lookup = datasetFromRequest(req);
    if (sendDatasetError(res, lookup) || !lookup.dataset) return;

    const report = validateDataset(lookup.dataset);
    await importRepository.createValidationReport({
      datasetId: lookup.datasetId,
      rowCount: report.totalRows,
      columnCount: report.totalColumns,
      missingValues: report.missingValues,
      duplicateRows: report.duplicateRows,
      emptyCells: report.emptyCells,
      qualityScore: report.qualityScore,
      summary: report.summary,
    });
    importStorageService.recordStep(lookup.dataset.sessionId, "Validation completed", "completed", lookup.datasetId);

    res.status(200).json({
      message: "Dataset validation complete",
      data: report,
    });
  },

  async analyseDataset(req: Request, res: Response) {
    const lookup = datasetFromRequest(req);
    if (sendDatasetError(res, lookup) || !lookup.dataset) return;

    const analysis = analyzeDataset(lookup.dataset);
    await importRepository.createAnalysis({
      datasetId: lookup.datasetId,
      detectedDatasetType: analysis.detectedDatasetType,
      confidence: analysis.confidence,
      entitiesJson: JSON.stringify(analysis.entities),
      summary: analysis.summary,
    });
    importStorageService.recordStep(lookup.dataset.sessionId, "Dataset analysed", "completed", lookup.datasetId);

    res.status(200).json({
      message: "Dataset analysis generated",
      data: analysis,
    });
  },

  async mapDataset(req: Request, res: Response) {
    const lookup = datasetFromRequest(req);
    if (sendDatasetError(res, lookup) || !lookup.dataset) return;

    const result = createFieldMappings(lookup.dataset, mappingOverrides(req.body?.overrides));
    importStorageService.saveMappings(lookup.datasetId, result.mappings);
    await importRepository.createFieldMappings(
      result.mappings.map((mapping) => ({
        datasetId: lookup.datasetId,
        sourceField: mapping.sourceField,
        targetField: mapping.targetField,
        confidence: mapping.confidence,
        status: mapping.status,
        userOverride: mapping.status === "user_modified" ? mapping.targetField : undefined,
      })),
    );
    importStorageService.recordStep(lookup.dataset.sessionId, "Fields mapped", "completed", lookup.datasetId);

    res.status(200).json({
      message: "Field mappings generated",
      data: result,
    });
  },

  async transformDataset(req: Request, res: Response) {
    const lookup = datasetFromRequest(req);
    if (sendDatasetError(res, lookup) || !lookup.dataset) return;

    const mappings = importStorageService.findMappings(lookup.datasetId) ?? createFieldMappings(lookup.dataset).mappings;
    const result = transformDataset(lookup.dataset, mappings);
    await importRepository.createInvestigationDataset({
      sessionId: result.sessionId,
      datasetId: lookup.datasetId,
      mappingVersion: result.mappingVersion,
      recordCount: result.recordCount,
      outputFormat: result.outputFormat,
      exportMetadataJson: JSON.stringify({
        filename: result.export.filename,
        mimeType: result.export.mimeType,
        generatedAt: result.generatedAt,
        mappedFields: result.mappedFields,
      }),
    });
    await importRepository.createTransformationLog({
      sessionId: result.sessionId,
      datasetId: lookup.datasetId,
      step: "investigation_dataset_generated",
      status: "completed",
      message: "Investigation dataset generated from confirmed mappings.",
      metadataJson: JSON.stringify({
        recordCount: result.recordCount,
        outputFormat: result.outputFormat,
      }),
    });
    importStorageService.recordStep(result.sessionId, "Investigation dataset generated", "completed", lookup.datasetId);

    res.status(200).json({
      message: "Investigation dataset generated",
      data: result,
    });
  },

  async getImportStatus(req: Request, res: Response) {
    const sessionId = String(req.params.sessionId ?? "").trim();

    if (!sessionId) {
      res.status(400).json({ message: "sessionId is required" });
      return;
    }

    res.status(200).json({
      message: "Import status retrieved",
      data: importStorageService.getStatus(sessionId),
    });
  },
};
