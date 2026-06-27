import { stat } from "node:fs/promises";
import type { NormalizedDataset } from "../types/DatasetRecord.js";
import { detectLog, durationSince, nowMs } from "../utils/logger.js";

const DATASET_CACHE_TTL_MS = 5 * 60 * 1000;

interface DatasetCacheEntry {
  csvMtimeMs: number;
  cachedAtMs: number;
  dataset: Promise<NormalizedDataset>;
}

const datasetCache = new Map<string, DatasetCacheEntry>();

export async function getCachedDataset(
  csvPath: string,
  loader: () => Promise<NormalizedDataset>,
  options: { bypassCache?: boolean } = {},
) {
  const startedAt = nowMs();
  const csvStats = await stat(csvPath);
  const cached = datasetCache.get(csvPath);
  const now = Date.now();

  if (
    cached &&
    !options.bypassCache &&
    cached.csvMtimeMs === csvStats.mtimeMs &&
    now - cached.cachedAtMs < DATASET_CACHE_TTL_MS
  ) {
    detectLog("success", "dataset cache hit", {
      source: csvPath,
      durationMs: durationSince(startedAt),
    });
    return cached.dataset;
  }

  if (cached && cached.csvMtimeMs !== csvStats.mtimeMs) {
    detectLog("warning", "dataset cache invalidated", { source: csvPath, reason: "csv_changed" });
  }

  const dataset = loader();
  datasetCache.set(csvPath, {
    csvMtimeMs: csvStats.mtimeMs,
    cachedAtMs: now,
    dataset,
  });

  return dataset;
}
