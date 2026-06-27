export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskBreakdown {
  sharedResource: number;
  reviewRing: number;
  refundAbuse: number;
  temporalBurst: number;
  denseCluster: number;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  breakdown: RiskBreakdown;
}

export interface ClusterSummary {
  id: string;
  score: number;
  level: RiskLevel;
}

export interface RiskResponse {
  clusterId: string;
  score: number;
  level: RiskLevel;
  breakdown: RiskBreakdown;
}

export interface DetectionMetrics {
  [metricName: string]: number | string | boolean | null;
}

export interface DetectorContext {
  detected: boolean;
  score: number;
  confidence: number;
  summary: string;
  metrics: DetectionMetrics;
  evidence: string[];
  [detailName: string]: unknown;
}

export interface SignalResponse {
  cluster: {
    id: string;
    risk: RiskResult;
  };
  summary: {
    buyers: number;
    sellers: number;
    orders: number;
    reviews: number;
    refunds: number;
  };
  detections: {
    sharedResource: boolean;
    reviewRing: boolean;
    refundAbuse: boolean;
    temporalBurst: boolean;
    denseCluster: boolean;
  };
  reasoningContext: {
    sharedResource: DetectorContext;
    reviewRing: DetectorContext;
    refundAbuse: DetectorContext;
    temporalBurst: DetectorContext;
    denseCluster: DetectorContext;
  };
  timeline: Array<{
    time: string;
    event: string;
  }>;
}

export type DetectorKey = keyof SignalResponse["detections"];
