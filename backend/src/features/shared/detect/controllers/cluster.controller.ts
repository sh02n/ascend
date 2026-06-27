import type { Request, Response } from "express";
import { getDataset } from "../repositories/dataset.repository.js";
import { clusterResponseSchema } from "../types/api.contract.js";
import type { RiskResult } from "../types/RiskEngine.js";
import { DEFAULT_CLUSTER_ID } from "../utils/clusterValidation.js";
import { detectLog, durationSince, nowMs } from "../utils/logger.js";
import { buildSignalAggregation } from "./signals.controller.js";

export interface ClusterListItem {
  id: string;
  score: number;
  level: RiskResult["level"];
}

export function sortClustersByRisk(clusters: ClusterListItem[]) {
  return [...clusters].sort((left, right) => right.score - left.score);
}

function parsePositiveInteger(value: unknown, fallback: number) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number.parseInt(String(rawValue ?? ""), 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export async function getClusters(req: Request, res: Response) {
  const startedAt = nowMs();

  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = Math.min(parsePositiveInteger(req.query.limit, 20), 100);
    const dataset = await getDataset();

    if (
      dataset.buyers.length === 0 &&
      dataset.sellers.length === 0 &&
      dataset.orders.length === 0 &&
      dataset.reviews.length === 0 &&
      dataset.refunds.length === 0
    ) {
      const response = clusterResponseSchema.parse([]);
      detectLog("success", "clusters response", { status: 200, durationMs: durationSince(startedAt) });
      res.status(200).json(response);
      return;
    }

    const aggregation = await buildSignalAggregation(DEFAULT_CLUSTER_ID, dataset);
    const clusters = sortClustersByRisk([
      {
        id: aggregation.cluster.id,
        score: aggregation.cluster.risk.score,
        level: aggregation.cluster.risk.level,
      },
    ]);

    const startIndex = (page - 1) * limit;
    const paginatedClusters = clusters.slice(startIndex, startIndex + limit);
    const response = clusterResponseSchema.parse(paginatedClusters);
    detectLog("success", "clusters response", {
      status: 200,
      clusters: response.length,
      page,
      limit,
      durationMs: durationSince(startedAt),
    });
    res.status(200).json(response);
  } catch (error) {
    detectLog("error", "clusters response", { status: 500, durationMs: durationSince(startedAt) });
    res.status(500).json({
      message: "Cluster processing failed",
    });
  }
}
