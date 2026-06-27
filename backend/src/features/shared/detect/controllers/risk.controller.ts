import type { Request, Response } from "express";
import { getDataset } from "../repositories/dataset.repository.js";
import { riskResponseSchema } from "../types/api.contract.js";
import type { DetectorRiskInputs, RiskResult } from "../types/RiskEngine.js";
import { DEFAULT_CLUSTER_ID, validateClusterId } from "../utils/clusterValidation.js";
import { detectLog, durationSince, nowMs } from "../utils/logger.js";
import { detectTemporalBurst } from "./burst.controller.js";
import { detectDenseCluster } from "./denseCluster.controller.js";
import { detectRefundAbuse } from "./refund.controller.js";
import { detectReviewRing } from "./reviewRing.controller.js";
import { detectSharedResources } from "./sharedResource.controller.js";

const MIN_RISK_SCORE = 0;
const MAX_RISK_SCORE = 100;

function clampScore(score: number) {
  return Math.min(MAX_RISK_SCORE, Math.max(MIN_RISK_SCORE, score));
}

function contribution(score: number, confidence: number, detected: boolean) {
  return detected ? Math.round(score * confidence) : 0;
}

function levelForScore(score: number): RiskResult["level"] {
  if (score >= 71) {
    return "HIGH";
  }

  if (score >= 31) {
    return "MEDIUM";
  }

  return "LOW";
}

export function calculateRisk(detectors: DetectorRiskInputs): RiskResult {
  const breakdown = {
    sharedResource: contribution(
      detectors.sharedResource.score,
      detectors.sharedResource.confidence,
      detectors.sharedResource.detected,
    ),
    reviewRing: contribution(
      detectors.reviewRing.score,
      detectors.reviewRing.confidence,
      detectors.reviewRing.detected,
    ),
    refundAbuse: contribution(
      detectors.refundAbuse.score,
      detectors.refundAbuse.confidence,
      detectors.refundAbuse.detected,
    ),
    temporalBurst: contribution(
      detectors.temporalBurst.score,
      detectors.temporalBurst.confidence,
      detectors.temporalBurst.detected,
    ),
    denseCluster: contribution(
      detectors.denseCluster.score,
      detectors.denseCluster.confidence,
      detectors.denseCluster.detected,
    ),
  };

  const score = clampScore(
    breakdown.sharedResource +
      breakdown.reviewRing +
      breakdown.refundAbuse +
      breakdown.temporalBurst +
      breakdown.denseCluster,
  );

  return {
    score,
    level: levelForScore(score),
    breakdown,
  };
}

export async function getRisk(req: Request, res: Response) {
  const startedAt = nowMs();
  const clusterId = Array.isArray(req.params.clusterId) ? req.params.clusterId[0] : req.params.clusterId;
  const validation = validateClusterId(clusterId);

  if (!validation.valid) {
    detectLog("warning", "risk rejected", { status: validation.status });
    res.status(validation.status).json({
      message: validation.message,
    });
    return;
  }

  try {
    const validClusterId = clusterId ?? DEFAULT_CLUSTER_ID;
    const dataset = await getDataset();
    const [sharedResource, reviewRing, refundAbuse, temporalBurst, denseCluster] = await Promise.all([
      detectSharedResources(dataset),
      detectReviewRing(dataset),
      detectRefundAbuse(dataset),
      detectTemporalBurst(dataset),
      detectDenseCluster(dataset),
    ]);
    const risk = calculateRisk({
      sharedResource,
      reviewRing,
      refundAbuse,
      temporalBurst,
      denseCluster,
    });
    const response = riskResponseSchema.parse({
      clusterId: validClusterId,
      score: risk.score,
      level: risk.level,
      breakdown: risk.breakdown,
    });

    detectLog("success", "risk response", {
      clusterId: validClusterId,
      status: 200,
      durationMs: durationSince(startedAt),
    });
    res.status(200).json(response);
  } catch (error) {
    detectLog("error", "risk response", { status: 500, durationMs: durationSince(startedAt) });
    res.status(500).json({
      message: "Risk processing failed",
    });
  }
}
