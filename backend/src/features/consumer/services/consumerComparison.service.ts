import OpenAI from "openai";
import { env } from "../../../config/env.js";
import type { ConsumerListingComparison, ConsumerUrlScanResult } from "../types/index.js";
import { scanConsumerUrl } from "./consumerUrlScanner.service.js";

type ComparisonPayload = ConsumerListingComparison["comparison"];

function riskWeight(level: ConsumerUrlScanResult["riskLevel"]) {
  if (level === "High") return 3;
  if (level === "Medium") return 2;
  return 1;
}

function saferListing(listingA: ConsumerUrlScanResult, listingB: ConsumerUrlScanResult): "A" | "B" {
  if (listingA.riskScore !== listingB.riskScore) return listingA.riskScore < listingB.riskScore ? "A" : "B";
  if (riskWeight(listingA.riskLevel) !== riskWeight(listingB.riskLevel)) {
    return riskWeight(listingA.riskLevel) < riskWeight(listingB.riskLevel) ? "A" : "B";
  }

  return listingA.confidence >= listingB.confidence ? "A" : "B";
}

function missingSignal(value: string | null | undefined) {
  return !value || value.trim().length === 0;
}

function fallbackComparison(listingA: ConsumerUrlScanResult, listingB: ConsumerUrlScanResult): ComparisonPayload {
  const winner = saferListing(listingA, listingB);
  const riskier = winner === "A" ? listingB : listingA;
  const differences = [
    `Listing A has a ${listingA.riskLevel.toLowerCase()} risk level with a risk score of ${listingA.riskScore}.`,
    `Listing B has a ${listingB.riskLevel.toLowerCase()} risk level with a risk score of ${listingB.riskScore}.`,
    missingSignal(listingA.extractedSignals.sellerText) === missingSignal(listingB.extractedSignals.sellerText)
      ? "Seller transparency appears similar based on the extracted page signals."
      : `${missingSignal(listingA.extractedSignals.sellerText) ? "Listing A" : "Listing B"} has weaker visible seller information.`,
    missingSignal(listingA.extractedSignals.reviewText) === missingSignal(listingB.extractedSignals.reviewText)
      ? "Review information appears similarly visible across both listings."
      : `${missingSignal(listingA.extractedSignals.reviewText) ? "Listing A" : "Listing B"} has less visible review information.`,
    missingSignal(listingA.extractedSignals.paymentText) === missingSignal(listingB.extractedSignals.paymentText)
      ? "Payment, return, or refund policy visibility appears similar."
      : `${missingSignal(listingA.extractedSignals.paymentText) ? "Listing A" : "Listing B"} has less visible payment, return, or refund policy information.`,
    `Recommendation: Listing ${winner} is the safer purchase based on fewer consumer-risk signals.`,
  ];

  return {
    winner,
    summary: `Listing ${winner} appears more trustworthy because it has a lower overall risk profile than ${riskier.domain}.`,
    differences: differences.slice(0, 6),
  };
}

function normalizeComparison(value: unknown, fallback: ComparisonPayload): ComparisonPayload {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const winner = record.winner === "A" || record.winner === "B" ? record.winner : fallback.winner;
  const differences = Array.isArray(record.differences)
    ? record.differences.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
    : fallback.differences;

  return {
    winner,
    summary: typeof record.summary === "string" && record.summary.trim() ? record.summary.trim() : fallback.summary,
    differences: differences.length > 0 ? differences : fallback.differences,
  };
}

async function generateOpenAiComparison(
  listingA: ConsumerUrlScanResult,
  listingB: ConsumerUrlScanResult,
  fallback: ComparisonPayload,
) {
  if (!env.OPENAI_API_KEY) return fallback;

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are Ascendra, a consumer trust assistant. Compare two existing listing investigation reports. Do not fetch or analyze webpages. Use only the provided scan results. Do not claim definite fraud. Return only valid JSON.",
      },
      {
        role: "user",
        content: JSON.stringify({
          listingA,
          listingB,
          focus: [
            "Fraud indicators",
            "Seller credibility",
            "Review authenticity",
            "Payment and refund information",
            "Consumer risk",
            "Overall trustworthiness",
          ],
          requiredJsonShape: {
            winner: "A | B",
            summary: "short explanation of the safer choice",
            differences: [
              "concise bullet about safer listing",
              "concise bullet about stronger suspicious indicators",
              "concise bullet about seller transparency",
              "concise bullet about reviews",
              "concise bullet about payment/refund information",
              "concise recommendation",
            ],
          },
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return fallback;

  try {
    return normalizeComparison(JSON.parse(content), fallback);
  } catch {
    return fallback;
  }
}

export async function compareConsumerListings(urlA: string, urlB: string): Promise<ConsumerListingComparison> {
  const [listingA, listingB] = await Promise.all([scanConsumerUrl(urlA), scanConsumerUrl(urlB)]);
  const fallback = fallbackComparison(listingA, listingB);
  const comparison = await generateOpenAiComparison(listingA, listingB, fallback).catch(() => fallback);

  return {
    listingA,
    listingB,
    comparison,
  };
}
