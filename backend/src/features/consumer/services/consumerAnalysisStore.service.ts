import type { ConsumerAnalysis } from "../types/index.js";

const analyses = new Map<string, ConsumerAnalysis>();

export function saveConsumerAnalysis(analysis: ConsumerAnalysis) {
  analyses.set(analysis.analysisId, analysis);
}

export function getConsumerAnalysisById(analysisId: string) {
  return analyses.get(analysisId) ?? null;
}
