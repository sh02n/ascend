import type { DenseClusterContext } from "./DenseClusterContext.js";
import type { RefundAbuseContext } from "./RefundAbuseContext.js";
import type { ReviewRingContext } from "./ReviewRingContext.js";
import type { RiskBreakdown } from "./RiskBreakdown.js";
import type { SharedResourceContext } from "./SharedResourceContext.js";
import type { TemporalBurstContext } from "./TemporalBurstContext.js";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface DetectorRiskInputs {
  sharedResource: SharedResourceContext;
  reviewRing: ReviewRingContext;
  refundAbuse: RefundAbuseContext;
  temporalBurst: TemporalBurstContext;
  denseCluster: DenseClusterContext;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  breakdown: RiskBreakdown;
}
