import { apiClient } from "../api/apiClient";
import type { SignalResponse } from "../../features/business/detect/types";
import type { ConsumerAnalysis } from "../../features/consumer/types";

export type SessionImportResponse = {
  sessionId: string;
  status: string;
  importedDatasetId?: string;
};

export type SessionVerifyResponse = {
  sessionId: string;
  analysisId: string;
  status: string;
};

export type SessionInvestigation = {
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

export type SessionDashboard = {
  overview: {
    sessionId: string;
    mode: "business" | "consumer";
    status: string;
    riskScore: number;
    riskLevel: string;
    summary: string;
  };
  graph: {
    nodes: Array<{ id: string; entityType: string; label: string }>;
    edges: Array<{ id: string; sourceNodeId: string; targetNodeId: string; relationship: string }>;
  };
  report: SessionInvestigation | null;
  metrics: {
    buyers: number;
    sellers: number;
    orders: number;
    reviews: number;
    refunds: number;
    flaggedSignals: number;
  };
};

export type SessionAnalysis = {
  sessionId: string;
  mode: "business" | "consumer";
  status: string;
  sourceType: string;
  consumerAnalysis?: ConsumerAnalysis;
  signals?: SignalResponse;
  investigation?: SessionInvestigation;
  dashboard?: SessionDashboard;
};

export async function importBusinessSession(file: File) {
  return apiClient<SessionImportResponse>("/session/import", {
    method: "POST",
    headers: {
      "Content-Type": file.type || "text/csv",
      "x-import-filename": encodeURIComponent(file.name),
    },
    body: file,
  });
}

export async function verifyProductSession(productUrl: string) {
  return apiClient<SessionVerifyResponse>("/session/verify", {
    method: "POST",
    body: JSON.stringify({ productUrl }),
  });
}

export async function getSessionAnalysis(sessionId: string) {
  return apiClient<SessionAnalysis>(`/session/${sessionId}/analysis`);
}

export async function detectSession(sessionId: string) {
  return apiClient<SignalResponse>(`/session/${sessionId}/detect`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function investigateSession(sessionId: string) {
  return apiClient<SessionInvestigation>(`/session/${sessionId}/investigate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getSessionDashboard(sessionId: string) {
  return apiClient<SessionDashboard>(`/session/${sessionId}/dashboard`);
}
