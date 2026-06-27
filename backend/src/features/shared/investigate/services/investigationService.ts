import { investigationReportMock } from "../mock/investigationReport.js";
import { generateOpenAiInvestigation } from "./openaiInvestigationService.js";
import type { AiInvestigationReport, InvestigationCluster } from "../types/index.js";

export async function generateInvestigation(
  cluster: InvestigationCluster,
): Promise<AiInvestigationReport> {
  try {
    return await generateOpenAiInvestigation(cluster);
  } catch {
    return {
      ...investigationReportMock,
      source: "fallback_mock",
    };
  }
}
