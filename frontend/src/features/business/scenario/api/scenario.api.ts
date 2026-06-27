import { apiClient } from "../../../../core/api/apiClient";
import type { LoadScenarioRequest, ScenarioSession } from "../types";

export async function loadScenario(payload: LoadScenarioRequest) {
  return apiClient<ScenarioSession>("/scenario/load", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function buildGraph(sessionId: string) {
  return apiClient<ScenarioSession>("/graph/build", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}
