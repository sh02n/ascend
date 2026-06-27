import { apiClient } from "../../../core/api/apiClient";
import type { ConsumerAnalysis } from "../types";

const CONSUMER_API_TIMEOUT_MS = 12_000;
const CONSUMER_COMPARE_TIMEOUT_MS = 28_000;

async function withTimeout<T>(request: (signal: AbortSignal) => Promise<T>, timeoutMs = CONSUMER_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

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

export type ConsumerUrlScanResult = {
  url: string;
  domain: string;
  title: string;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High";
  confidence: number;
  summary: string;
  evidence: string[];
  suspiciousSignals: string[];
  recommendation: string;
  extractedSignals: {
    pageTitle: string;
    description: string;
    priceText: string | null;
    ratingText: string | null;
    reviewText: string | null;
    sellerText: string | null;
    paymentText: string | null;
  };
};

export type ConsumerListingComparison = {
  listingA: ConsumerUrlScanResult;
  listingB: ConsumerUrlScanResult;
  comparison: {
    winner: "A" | "B";
    summary: string;
    differences: string[];
  };
};

export async function scanConsumerUrl(url: string) {
  return withTimeout((signal) =>
    apiClient<ConsumerUrlScanResult>("/consumer/scan-url", {
      method: "POST",
      body: JSON.stringify({ url }),
      signal,
    }),
  );
}

export async function compareConsumerListings(urlA: string, urlB: string) {
  return withTimeout(
    (signal) =>
      apiClient<ConsumerListingComparison>("/consumer/compare", {
        method: "POST",
        body: JSON.stringify({ urlA, urlB }),
        signal,
      }),
    CONSUMER_COMPARE_TIMEOUT_MS,
  );
}
