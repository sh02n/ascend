import type { Request, Response } from "express";
import { explainInvestigationQuestion } from "../services/explanationService.js";
import type { ExplainBody } from "../types/index.js";

export const recommendationController = {
  async explain(req: Request, res: Response) {
    const { question, cluster, investigation } = req.body as ExplainBody;
    const answer = await explainInvestigationQuestion(question, cluster, investigation);

    res.status(200).json({ answer });
  },
};
