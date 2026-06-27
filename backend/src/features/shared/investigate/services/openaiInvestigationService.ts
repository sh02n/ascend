import OpenAI from "openai";
import { env } from "../../../../config/env.js";
import { buildInvestigationPrompt } from "../prompts/investigationPrompt.js";
import type {
  AiInvestigationReport,
  InvestigationCluster,
  RiskLevel,
  SuggestedQuestion,
} from "../types/index.js";

type OpenAiRiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface OpenAiInvestigationReport {
  id: string;
  generatedAt: string;
  executiveSummary: string;
  evidence: Array<{
    title: string;
    severity: OpenAiRiskLevel;
    description: string;
    source: string;
  }>;
  fraudPattern: {
    name: string;
    confidence: number;
    explanation: string;
    supportingPoints: string[];
  };
  falsePositiveConsiderations: Array<{
    title: string;
    likelihood: OpenAiRiskLevel;
    explanation: string;
  }>;
  missingEvidence: Array<{
    title: string;
    priority: OpenAiRiskLevel;
    reason: string;
  }>;
  recommendation: {
    action: string;
    priority: OpenAiRiskLevel;
    rationale: string;
    nextSteps: string[];
  };
  timelineNarrative: Array<{
    title: string;
    time: string;
    description: string;
  }>;
  suggestedQuestions: string[];
}

const riskLevels = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export async function generateOpenAiInvestigation(
  cluster: InvestigationCluster,
): Promise<AiInvestigationReport> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: buildInvestigationPrompt(cluster),
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty investigation response.");
  }

  const parsed = parseInvestigationJson(content);
  return normalizeInvestigationReport(parsed);
}

function parseInvestigationJson(content: string): OpenAiInvestigationReport {
  const directParse = tryParseJson(content);

  if (directParse) {
    return directParse;
  }

  const extractedJson = extractJsonObject(content);
  const extractedParse = extractedJson ? tryParseJson(extractedJson) : null;

  if (extractedParse) {
    return extractedParse;
  }

  throw new Error("OpenAI returned invalid JSON.");
}

function tryParseJson(content: string): OpenAiInvestigationReport | null {
  try {
    return JSON.parse(content) as OpenAiInvestigationReport;
  } catch {
    return null;
  }
}

function extractJsonObject(content: string) {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return content.slice(start, end + 1);
}

function normalizeInvestigationReport(
  report: OpenAiInvestigationReport,
): AiInvestigationReport {
  assertOpenAiReport(report);

  return {
    reportId: report.id,
    generatedAt: report.generatedAt,
    source: "openai",
    executiveSummary: report.executiveSummary,
    evidence: report.evidence.map((item, index) => ({
      id: `ev-ai-${index + 1}`,
      label: item.title,
      severity: normalizeRiskLevel(item.severity),
      detail: item.description,
      source: item.source,
    })),
    pattern: {
      title: report.fraudPattern.name,
      confidence: normalizeConfidence(report.fraudPattern.confidence),
      description: report.fraudPattern.explanation,
      indicators: report.fraudPattern.supportingPoints,
    },
    falsePositives: report.falsePositiveConsiderations.map((item, index) => ({
      id: `fp-ai-${index + 1}`,
      consideration: item.title,
      assessment: item.explanation,
      likelihood: normalizeRiskLevel(item.likelihood),
    })),
    missingEvidence: report.missingEvidence.map((item, index) => ({
      id: `me-ai-${index + 1}`,
      evidence: item.title,
      reason: item.reason,
      priority: normalizeRiskLevel(item.priority),
    })),
    recommendation: {
      action: report.recommendation.action,
      priority: normalizeRiskLevel(report.recommendation.priority),
      rationale: report.recommendation.rationale,
      nextSteps: report.recommendation.nextSteps,
    },
    timeline: report.timelineNarrative.map((item, index) => ({
      id: `tl-ai-${index + 1}`,
      timestamp: item.time,
      title: item.title,
      description: item.description,
      riskImpact: "MEDIUM",
    })),
    suggestedQuestions: report.suggestedQuestions.map(mapSuggestedQuestion),
  };
}

function assertOpenAiReport(report: OpenAiInvestigationReport) {
  if (
    !report ||
    !report.id ||
    !report.generatedAt ||
    !report.executiveSummary ||
    !Array.isArray(report.evidence) ||
    !report.fraudPattern ||
    !Array.isArray(report.falsePositiveConsiderations) ||
    !Array.isArray(report.missingEvidence) ||
    !report.recommendation ||
    !Array.isArray(report.timelineNarrative) ||
    !Array.isArray(report.suggestedQuestions)
  ) {
    throw new Error("OpenAI investigation response is missing required fields.");
  }
}

function normalizeRiskLevel(value: string): RiskLevel {
  return riskLevels.has(value) ? (value as RiskLevel) : "MEDIUM";
}

function normalizeConfidence(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value <= 1 ? value * 100 : value);
}

function mapSuggestedQuestion(question: string, index: number): SuggestedQuestion {
  return {
    id: question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `ai-question-${index + 1}`,
    question,
    answer: "",
  };
}
