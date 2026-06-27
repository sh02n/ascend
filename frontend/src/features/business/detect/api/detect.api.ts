import { apiClient } from "../../../../core/api/apiClient";
import type { ClusterSummary, RiskResponse, SignalResponse } from "../types";

const DETECT_API_TIMEOUT_MS = 10_000;

async function withTimeout<T>(request: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DETECT_API_TIMEOUT_MS);

  try {
    return await request(controller.signal);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Detection API timed out. Check that the backend is running.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getClusters(params: { page?: number; limit?: number } = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  const queryString = searchParams.toString();

  return withTimeout((signal) =>
    apiClient<ClusterSummary[]>(`/clusters${queryString ? `?${queryString}` : ""}`, { signal }),
  );
}

export async function getSignals(clusterId: string) {
  return withTimeout((signal) => apiClient<SignalResponse>(`/signals/${clusterId}`, { signal }));
}

export async function getRisk(clusterId: string) {
  return withTimeout((signal) => apiClient<RiskResponse>(`/risk/${clusterId}`, { signal }));
}
