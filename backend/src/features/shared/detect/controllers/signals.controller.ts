import type { Request, Response } from "express";
import { getDataset } from "../repositories/dataset.repository.js";
import { signalResponseSchema } from "../types/api.contract.js";
import type { NormalizedDataset } from "../types/DatasetRecord.js";
import type { DetectorRiskInputs, RiskResult } from "../types/RiskEngine.js";
import { validateClusterId } from "../utils/clusterValidation.js";
import { detectLog, durationSince, nowMs } from "../utils/logger.js";
import { detectTemporalBurst } from "./burst.controller.js";
import { detectDenseCluster } from "./denseCluster.controller.js";
import { detectRefundAbuse } from "./refund.controller.js";
import { detectReviewRing } from "./reviewRing.controller.js";
import { calculateRisk } from "./risk.controller.js";
import { detectSharedResources } from "./sharedResource.controller.js";

interface TimelineSourceEvent {
  timestamp: string;
  event: string;
}

export interface DetectionSummary {
  buyers: number;
  sellers: number;
  orders: number;
  reviews: number;
  refunds: number;
}

export interface SignalAggregation {
  cluster: {
    id: string;
    risk: RiskResult;
  };
  summary: DetectionSummary;
  detections: {
    sharedResource: boolean;
    reviewRing: boolean;
    refundAbuse: boolean;
    temporalBurst: boolean;
    denseCluster: boolean;
  };
  reasoningContext: DetectorRiskInputs;
  timeline: Array<{
    time: string;
    event: string;
  }>;
}

function normalizeClusterParam(clusterId: string | string[] | undefined) {
  return Array.isArray(clusterId) ? clusterId[0] : clusterId;
}

function toTimelineTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function addTimelineEvent(
  timeline: TimelineSourceEvent[],
  timestamp: string | null | undefined,
  event: string,
) {
  if (!timestamp) {
    return;
  }

  const parsedTimestamp = Date.parse(timestamp);

  if (Number.isNaN(parsedTimestamp)) {
    return;
  }

  timeline.push({
    timestamp: new Date(parsedTimestamp).toISOString(),
    event,
  });
}

export function buildSummary(dataset: NormalizedDataset): DetectionSummary {
  return {
    buyers: dataset.buyers.length,
    sellers: dataset.sellers.length,
    orders: dataset.orders.length,
    reviews: dataset.reviews.length,
    refunds: dataset.refunds.length,
  };
}

export function buildTimeline(dataset: NormalizedDataset) {
  const timeline: TimelineSourceEvent[] = [];

  for (const seller of dataset.sellers) {
    addTimelineEvent(timeline, seller.createdAt, "Seller Created");
  }

  for (const buyer of dataset.buyers) {
    addTimelineEvent(timeline, buyer.createdAt, "Buyer Created");
  }

  for (const order of dataset.orders) {
    addTimelineEvent(timeline, order.orderDate, "Order Created");
  }

  for (const review of dataset.reviews) {
    addTimelineEvent(timeline, review.reviewDate, "Review Created");
  }

  for (const refund of dataset.refunds) {
    addTimelineEvent(timeline, refund.refundDate, "Refund Created");
  }

  return timeline
    .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp))
    .map((item) => ({
      time: toTimelineTime(item.timestamp),
      event: item.event,
    }));
}

export async function buildSignalAggregation(
  clusterId: string,
  dataset?: NormalizedDataset,
): Promise<SignalAggregation> {
  const aggregationDataset = dataset ?? (await getDataset());
  const startedAt = nowMs();
  detectLog("start", "detectors execute", { clusterId });
  const [sharedResource, reviewRing, refundAbuse, temporalBurst, denseCluster] = await Promise.all([
    detectSharedResources(aggregationDataset),
    detectReviewRing(aggregationDataset),
    detectRefundAbuse(aggregationDataset),
    detectTemporalBurst(aggregationDataset),
    detectDenseCluster(aggregationDataset),
  ]);
  detectLog("success", "detectors execute", { clusterId, durationMs: durationSince(startedAt) });
  const reasoningContext = {
    sharedResource,
    reviewRing,
    refundAbuse,
    temporalBurst,
    denseCluster,
  };
  const riskStartedAt = nowMs();
  const risk = calculateRisk(reasoningContext);
  detectLog("success", "risk generation", {
    clusterId,
    score: risk.score,
    level: risk.level,
    durationMs: durationSince(riskStartedAt),
  });

  return {
    cluster: {
      id: clusterId,
      risk,
    },
    summary: buildSummary(aggregationDataset),
    detections: {
      sharedResource: sharedResource.detected,
      reviewRing: reviewRing.detected,
      refundAbuse: refundAbuse.detected,
      temporalBurst: temporalBurst.detected,
      denseCluster: denseCluster.detected,
    },
    reasoningContext,
    timeline: buildTimeline(aggregationDataset),
  };
}

export async function getSignals(req: Request, res: Response) {
  const startedAt = nowMs();
  const clusterId = normalizeClusterParam(req.params.clusterId);
  const validation = validateClusterId(clusterId);

  if (!validation.valid) {
    detectLog("warning", "signals rejected", { status: validation.status });
    res.status(validation.status).json({ message: validation.message });
    return;
  }

  try {
    const validClusterId = clusterId as string;
    const response = await buildSignalAggregation(validClusterId);
    const validatedResponse = signalResponseSchema.parse(response);

    detectLog("success", "signals response", {
      clusterId: validClusterId,
      status: 200,
      durationMs: durationSince(startedAt),
    });
    res.status(200).json(validatedResponse);
  } catch (error) {
    detectLog("error", "signals response", { status: 500, durationMs: durationSince(startedAt) });
    res.status(500).json({
      message: "Fraud signal processing failed",
    });
  }
}
