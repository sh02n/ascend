import type { Request, Response } from "express";
import { dashboardRepository } from "../repositories/dashboard.repository.js";

export const caseController = {
  async updateCase(req: Request, res: Response) {
    const { caseId, status } = req.body;
    const updatedCase = await dashboardRepository.updateCase(caseId, status);

    // TODO: add case tracking rules and ownership updates here.
    res.status(200).json(updatedCase);
  },
};
