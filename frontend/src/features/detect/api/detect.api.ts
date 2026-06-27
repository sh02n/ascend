import { apiClient } from "../../../shared/lib/apiClient";
import type { ClusterSummary, RiskSummary, SignalDetail } from "../types";

export async function getClusters() {
  return apiClient<ClusterSummary[]>("/clusters");
}

export async function getSignal(signalId: string) {
  return apiClient<SignalDetail>(`/signals/${signalId}`);
}

export async function getRisk(riskId: string) {
  return apiClient<RiskSummary>(`/risk/${riskId}`);
}
