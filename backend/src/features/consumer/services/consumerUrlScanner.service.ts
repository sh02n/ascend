import OpenAI from "openai";
import { env } from "../../../config/env.js";
import type { ConsumerUrlScanResult } from "../types/index.js";
import { validatePublicConsumerUrl } from "./consumerUrlSafety.service.js";

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_AI_TEXT_LENGTH = 8_000;

const suspiciousPhrases = [
  "whatsapp only",
  "telegram",
  "bank transfer only",
  "wire transfer",
  "crypto only",
  "no refund",
  "limited stock",
  "urgent",
  "100% guaranteed",
  "too good to be true",
];

type ExtractedPage = {
  url: string;
  domain: string;
  pageTitle: string;
  description: string;
  visibleText: string;
  priceText: string | null;
  ratingText: string | null;
  reviewText: string | null;
  sellerText: string | null;
  paymentText: string | null;
  fetchLimited: boolean;
  fetchError?: string;
};

type AiScanPayload = Pick<
  ConsumerUrlScanResult,
  "riskScore" | "riskLevel" | "confidence" | "summary" | "evidence" | "suspiciousSignals" | "recommendation"
>;

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function riskLevelForScore(score: number): ConsumerUrlScanResult["riskLevel"] {
  if (score <= 39) return "Low";
  if (score <= 69) return "Medium";
  return "High";
}

function normalizeWhitespace(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMeta(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return normalizeWhitespace(decodeHtml(match[1]));
  }

  return "";
}

function extractTitle(html: string, fallback: string) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return normalizeWhitespace(decodeHtml(title ?? "")) || fallback;
}

function htmlToVisibleText(html: string) {
  return normalizeWhitespace(
    decodeHtml(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function findSnippet(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  if (!match?.index && match?.index !== 0) return null;

  return text.slice(Math.max(0, match.index - 80), Math.min(text.length, match.index + 220));
}

function findSuspiciousSignals(text: string) {
  const lowerText = text.toLowerCase();
  return suspiciousPhrases.filter((phrase) => lowerText.includes(phrase));
}

async function fetchPage(url: URL) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 AscendraScanner/1.0",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok) {
      return { html: "", error: `Page returned HTTP ${response.status}` };
    }

    if (!contentType.includes("text/html")) {
      return { html: "", error: "Page did not return readable HTML content" };
    }

    return { html: await response.text(), error: undefined };
  } catch (error) {
    return {
      html: "",
      error: error instanceof Error && error.name === "AbortError" ? "Page fetch timed out" : "Page could not be fetched",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractPage(url: URL, html: string, fetchError?: string): ExtractedPage {
  const fallbackTitle = url.pathname.split("/").filter(Boolean).at(-1)?.replace(/[-_]+/g, " ") || url.hostname;
  const visibleText = html ? htmlToVisibleText(html) : "";
  const combinedText = `${visibleText} ${url.href}`;

  return {
    url: url.href,
    domain: url.hostname.replace(/^www\./, ""),
    pageTitle: html ? extractTitle(html, fallbackTitle) : fallbackTitle,
    description: html ? extractMeta(html, "description") || extractMeta(html, "og:description") : "",
    visibleText,
    priceText: findSnippet(combinedText, /(?:[$€£₹]\s?\d[\d,.]*|\b\d[\d,.]*\s?(?:usd|sgd|eur|gbp)\b)/i),
    ratingText: findSnippet(combinedText, /(?:rated|rating|stars?|reviews?)\s.{0,80}?(?:\d(?:\.\d)?\s?(?:\/\s?5|stars?)?|\d+\s?reviews?)/i),
    reviewText: findSnippet(combinedText, /(?:reviews?|customer feedback|buyer feedback|verified purchase)/i),
    sellerText: findSnippet(combinedText, /(?:seller|sold by|store|merchant|vendor|shop)/i),
    paymentText: findSnippet(combinedText, /(?:payment|refund|return|bank transfer|wire transfer|crypto|paypal|card)/i),
    fetchLimited: Boolean(fetchError) || visibleText.length < 400,
    fetchError,
  };
}

function buildExtractedSignals(page: ExtractedPage): ConsumerUrlScanResult["extractedSignals"] {
  return {
    pageTitle: page.pageTitle,
    description: page.description,
    priceText: page.priceText,
    ratingText: page.ratingText,
    reviewText: page.reviewText,
    sellerText: page.sellerText,
    paymentText: page.paymentText,
  };
}

function fallbackAnalysis(page: ExtractedPage): AiScanPayload {
  const suspiciousSignals = findSuspiciousSignals(`${page.visibleText} ${page.description}`);
  const evidence: string[] = [];
  let score = 12;

  if (page.fetchLimited) {
    score += 18;
    evidence.push(page.fetchError ? `Limited page read: ${page.fetchError}.` : "Limited readable page content was available.");
  }

  if (!page.sellerText) {
    score += 14;
    evidence.push("Seller or store information was not clearly visible in the extracted content.");
  }

  if (!page.paymentText) {
    score += 8;
    evidence.push("Refund, return, or payment policy language was not clearly visible.");
  }

  for (const signal of suspiciousSignals) {
    score += signal.includes("transfer") || signal.includes("crypto") || signal.includes("whatsapp") || signal.includes("telegram") ? 18 : 9;
    evidence.push(`Suspicious phrase found: "${signal}".`);
  }

  if (/\burgent\b|\blimited stock\b/i.test(page.visibleText)) {
    evidence.push("Urgency or scarcity language appears in the page content.");
  }

  const riskScore = clamp(score);
  const confidence = clamp(page.fetchLimited ? 38 + suspiciousSignals.length * 5 : 68 + Math.min(20, suspiciousSignals.length * 4));

  return {
    riskScore,
    riskLevel: riskLevelForScore(riskScore),
    confidence,
    summary:
      riskScore >= 70
        ? "This page shows multiple suspicious signals. Evidence is not definitive, but the listing should be treated with caution."
        : riskScore >= 40
          ? "This page has some risk indicators. Review seller details, payment terms, and return policy before proceeding."
          : "This page shows limited obvious risk indicators based on the extracted content.",
    evidence: evidence.length > 0 ? evidence.slice(0, 6) : ["No high-risk phrases were found in the extracted page content."],
    suspiciousSignals,
    recommendation:
      riskScore >= 70
        ? "Avoid paying off-platform and consider choosing a more established seller."
        : riskScore >= 40
          ? "Proceed with caution and verify the seller, reviews, payment method, and refund policy."
          : "Proceed normally, but still compare recent reviews and seller details.",
  };
}

function normalizeAiPayload(value: unknown, fallback: AiScanPayload): AiScanPayload {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const riskScore = clamp(typeof record.riskScore === "number" ? record.riskScore : fallback.riskScore);

  return {
    riskScore,
    riskLevel: riskLevelForScore(riskScore),
    confidence: clamp(typeof record.confidence === "number" ? record.confidence : fallback.confidence),
    summary:
      typeof record.summary === "string" && record.summary.trim()
        ? safeConsumerLanguage(record.summary.trim())
        : fallback.summary,
    evidence: Array.isArray(record.evidence)
      ? record.evidence.map((item) => safeConsumerLanguage(String(item))).filter(Boolean).slice(0, 8)
      : fallback.evidence,
    suspiciousSignals: Array.isArray(record.suspiciousSignals)
      ? record.suspiciousSignals.map(String).filter(Boolean).slice(0, 10)
      : fallback.suspiciousSignals,
    recommendation:
      typeof record.recommendation === "string" && record.recommendation.trim()
        ? safeConsumerLanguage(record.recommendation.trim())
        : fallback.recommendation,
  };
}

function safeConsumerLanguage(value: string) {
  return value
    .replace(/\bdefinitely fraud\b/gi, "showing high-risk indicators")
    .replace(/\bscammer\b/gi, "potentially risky seller")
    .replace(/\bscam\b/gi, "suspicious activity")
    .replace(/\btrustworthy\b/gi, "showing limited suspicious signals")
    .replace(/\bno action needed\b/gi, "No major suspicious signals were found");
}

async function analyzeWithOpenAi(page: ExtractedPage, fallback: AiScanPayload): Promise<AiScanPayload> {
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
          "You are Ascendra, an AI investigation assistant. You assess consumer marketplace or product URLs for suspicious fraud indicators using only the provided extracted webpage content. Do not invent facts. If evidence is limited, say so clearly. Do not claim something is definitely fraud. Return only valid JSON.",
      },
      {
        role: "user",
        content: JSON.stringify({
          url: page.url,
          domain: page.domain,
          title: page.pageTitle,
          description: page.description,
          fetchLimited: page.fetchLimited,
          fetchError: page.fetchError,
          extractedSignals: buildExtractedSignals(page),
          visibleText: page.visibleText.slice(0, MAX_AI_TEXT_LENGTH),
          requiredJsonShape: {
            riskScore: "number 0-100",
            riskLevel: "Low | Medium | High",
            confidence: "number 0-100",
            summary: "string",
            evidence: "string[]",
            suspiciousSignals: "string[]",
            recommendation: "string",
          },
        }),
      },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) return fallback;

  try {
    return normalizeAiPayload(JSON.parse(content), fallback);
  } catch {
    return fallback;
  }
}

export async function scanConsumerUrl(rawUrl: string): Promise<ConsumerUrlScanResult> {
  const url = await validatePublicConsumerUrl(rawUrl);
  const fetched = await fetchPage(url);
  const page = extractPage(url, fetched.html, fetched.error);
  const fallback = fallbackAnalysis(page);
  const analysis = await analyzeWithOpenAi(page, fallback).catch(() => fallback);

  return {
    url: url.href,
    domain: page.domain,
    title: page.pageTitle,
    ...analysis,
    extractedSignals: buildExtractedSignals(page),
  };
}
