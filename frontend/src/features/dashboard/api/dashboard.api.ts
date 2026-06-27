import { apiClient } from "../../../shared/lib/apiClient";
import type { CaseSummary, DashboardSummary, ReportPayload } from "../types";

export async function getDashboard() {
  return apiClient<DashboardSummary>("/dashboard");
}

export async function createReport(payload: ReportPayload) {
  return apiClient<{ reportId: string }>("/report", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCase(caseId: string, payload: Partial<CaseSummary>) {
  return apiClient<CaseSummary>("/case", {
    method: "PATCH",
    body: JSON.stringify({ caseId, ...payload }),
  });
}
