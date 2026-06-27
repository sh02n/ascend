import type { NormalizedDataset } from "../types/DatasetRecord.js";
import { exampleNormalizedDataset } from "../types/DatasetRecord.js";
import { detectLog, durationSince, nowMs } from "../utils/logger.js";
import { getCachedDataset } from "./cache.repository.js";
import { loadCSV } from "./csv.repository.js";
import { enrichDataset } from "./enrichment.repository.js";

const DEFAULT_CSV_PATH =
  process.env.DETECT_CSV_PATH ?? "/Users/arjunaravapalli/Downloads/Amazon_Reviews.csv";
const DATASET_CACHE_ENABLED = process.env.DETECT_CACHE !== "false" || process.env.DEMO_MODE === "true";

export interface DatasetRepositoryOptions {
  csvPath?: string;
  bypassCache?: boolean;
}

export async function getDataset(
  options: DatasetRepositoryOptions = {},
): Promise<NormalizedDataset> {
  const csvPath = options.csvPath ?? DEFAULT_CSV_PATH;

  const loadDataset = async () => {
    const startedAt = nowMs();
    detectLog("start", "dataset load", { source: csvPath, demoMode: process.env.DEMO_MODE === "true" });
    const dataset = await loadCSV(csvPath);
    const enrichedDataset = enrichDataset(dataset);

    detectLog("success", "dataset load", {
      source: csvPath,
      durationMs: durationSince(startedAt),
      buyers: enrichedDataset.buyers.length,
      sellers: enrichedDataset.sellers.length,
      orders: enrichedDataset.orders.length,
      reviews: enrichedDataset.reviews.length,
      refunds: enrichedDataset.refunds.length,
    });
    return enrichedDataset;
  };

  if (DATASET_CACHE_ENABLED && !options.bypassCache) {
    return getCachedDataset(csvPath, loadDataset, options);
  }

  return loadDataset();
}

export const exampleDatasetOutput: NormalizedDataset = exampleNormalizedDataset;
