import type { SignalAggregation } from "../../features/shared/detect/controllers/signals.controller.js";
import type { NormalizedDataset } from "../../features/shared/detect/types/DatasetRecord.js";
import type { ConsumerAnalysis, ConsumerProduct } from "../../features/consumer/types/index.js";

export type InvestigationSessionMode = "business" | "consumer";
export type InvestigationSessionStatus =
  | "imported"
  | "verified"
  | "detected"
  | "investigated"
  | "dashboard_ready";

export interface StoredSessionSource {
  dataset: NormalizedDataset;
  product?: ConsumerProduct;
  filename?: string;
}

export interface SessionInvestigation {
  evidence: Array<{
    id: string;
    label: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    detail: string;
    source: string;
  }>;
  pattern: {
    title: string;
    confidence: number;
    description: string;
    indicators: string[];
  };
  falsePositive: Array<{
    id: string;
    consideration: string;
    assessment: string;
    likelihood: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }>;
  recommendation: {
    action: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    rationale: string;
    nextSteps: string[];
  };
  timeline: Array<{
    id: string;
    timestamp: string;
    title: string;
    description: string;
    riskImpact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }>;
};

export interface SessionDashboard {
  overview: {
    sessionId: string;
    mode: InvestigationSessionMode;
    status: InvestigationSessionStatus;
    riskScore: number;
    riskLevel: string;
    summary: string;
  };
  graph: NormalizedDataset["graph"];
  report: SessionInvestigation | null;
  metrics: {
    buyers: number;
    sellers: number;
    orders: number;
    reviews: number;
    refunds: number;
    flaggedSignals: number;
  };
}

export interface SessionAnalysis {
  sessionId: string;
  mode: InvestigationSessionMode;
  status: InvestigationSessionStatus;
  sourceType: string;
  product?: ConsumerProduct;
  consumerAnalysis?: ConsumerAnalysis;
  signals?: SignalAggregation;
  investigation?: SessionInvestigation;
  dashboard?: SessionDashboard;
}
