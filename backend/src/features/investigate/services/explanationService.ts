import { explanationAnswers } from "../mock/explanationAnswers.js";
import { generateOpenAiExplanation } from "./openaiExplanationService.js";
import type { AiInvestigationReport, InvestigationCluster } from "../types/index.js";

export async function explainInvestigationQuestion(
  question: string,
  cluster: InvestigationCluster,
  investigation: AiInvestigationReport,
): Promise<string> {
  try {
    return await generateOpenAiExplanation(question, cluster, investigation);
  } catch (error) {
    console.warn(
      `[investigation] Falling back to local explanation: ${
        error instanceof Error ? error.message : "unknown OpenAI error"
      }`,
    );

    return explanationAnswers[question] ?? buildGenericFallbackAnswer(investigation);
  }
}

function buildGenericFallbackAnswer(investigation: AiInvestigationReport) {
  const evidenceSummary = investigation.evidence
    .slice(0, 3)
    .map((item) => item.label.toLowerCase())
    .join(", ");
  const missingEvidence = investigation.missingEvidence
    .slice(0, 2)
    .map((item) => item.evidence.toLowerCase())
    .join(" and ");

  if (!evidenceSummary) {
    return "Based on the current investigation, there is not enough evidence in the report to answer that with confidence. More account-level and review-level evidence would be needed before making a stronger assessment.";
  }

  const uncertainty = missingEvidence
    ? ` More certainty would require ${missingEvidence}.`
    : " More corroborating evidence would be needed to fully confirm coordination.";

  return `Based on the current investigation, this cluster is suspicious because the evidence highlights ${evidenceSummary}. ${investigation.executiveSummary}${uncertainty}`;
}
