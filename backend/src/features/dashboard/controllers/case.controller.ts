import type { Request, Response } from "express";
import { dashboardRepository } from "../repositories/dashboard.repository.js";
import type { UpdateCaseBody } from "../types/index.js";

export const caseController = {
  async updateCase(req: Request, res: Response) {
    const { caseId = "case_cluster_001", status, notes } = (req.body ?? {}) as UpdateCaseBody;
    const updatedCase = await dashboardRepository.updateCase(caseId, status, notes);

    res.status(200).json(updatedCase);
  },
};
