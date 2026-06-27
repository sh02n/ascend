import type { Request, Response } from "express";
import { getConsumerAnalysisById } from "../services/consumerAnalysisStore.service.js";
import { consumerAnalysisSchema } from "../types/index.js";

export async function getConsumerAnalysis(req: Request, res: Response) {
  const analysisId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!analysisId) {
    res.status(400).json({ message: "Analysis id is required." });
    return;
  }

  const analysis = getConsumerAnalysisById(analysisId);

  if (!analysis) {
    res.status(404).json({ message: "Analysis not found. Run verify again to refresh this result." });
    return;
  }

  res.status(200).json(consumerAnalysisSchema.parse(analysis));
}
