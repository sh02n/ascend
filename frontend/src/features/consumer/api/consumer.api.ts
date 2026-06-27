import { apiClient } from "../../../core/api/apiClient";
import type { ConsumerAnalysis } from "../types";

const CONSUMER_API_TIMEOUT_MS = 12_000;

async function withTimeout<T>(request: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), CONSUMER_API_TIMEOUT_MS);

  try {
    return await request(controller.signal);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Verification timed out. Please try again.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function verifyProduct(productUrl: string) {
  return withTimeout((signal) =>
    apiClient<{ analysisId: string; sessionId: string }>("/session/verify", {
      method: "POST",
      body: JSON.stringify({ productUrl }),
      signal,
    }),
  );
}

export async function getConsumerAnalysis(analysisId: string) {
  return withTimeout(async (signal) => {
    const response = await apiClient<{ consumerAnalysis?: ConsumerAnalysis }>(`/session/${analysisId}/analysis`, { signal });

    if (!response.consumerAnalysis) {
      throw new Error("Consumer analysis is not available for this session.");
    }

    return response.consumerAnalysis;
  });
}
