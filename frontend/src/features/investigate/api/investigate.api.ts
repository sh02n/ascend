import { apiClient } from "../../../shared/lib/apiClient";
import type { ExplainRequest, InvestigationResult } from "../types";

export async function investigateCase(payload: Record<string, unknown>) {
  return apiClient<InvestigationResult>("/investigate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function explainCase(payload: ExplainRequest) {
  return apiClient<InvestigationResult>("/explain", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
