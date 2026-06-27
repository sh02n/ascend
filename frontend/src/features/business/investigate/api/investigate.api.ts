import { apiClient } from "../../../../core/api/apiClient";
import type {
  ExplainApiRequest,
  ExplainApiResponse,
  InvestigateApiRequest,
  InvestigateApiResponse,
} from "../../../../shared/types/investigation";

export async function investigateCluster(payload: InvestigateApiRequest) {
  const response = await apiClient<InvestigateApiResponse>("/investigate", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response?.investigation) {
    throw new Error("The investigation service returned an empty response.");
  }

  return response.investigation;
}

export async function explainInvestigation(payload: ExplainApiRequest) {
  const response = await apiClient<ExplainApiResponse>("/explain", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response?.answer) {
    throw new Error("The explanation service returned an empty response.");
  }

  return response;
}
