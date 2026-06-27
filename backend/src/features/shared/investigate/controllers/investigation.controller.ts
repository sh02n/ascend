import type { Request, Response } from "express";
import { generateInvestigation } from "../services/investigationService.js";
import type { InvestigateBody } from "../types/index.js";

export const investigationController = {
  async investigate(req: Request, res: Response) {
    const { cluster } = req.body as InvestigateBody;
    const investigation = await generateInvestigation(cluster);

    res.status(200).json({ investigation });
  },
};
