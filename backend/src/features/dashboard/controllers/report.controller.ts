import type { Request, Response } from "express";
import { dashboardRepository } from "../repositories/dashboard.repository.js";

export const reportController = {
  async createReport(req: Request, res: Response) {
    const { caseId = "case_cluster_001" } = req.body ?? {};
    const report = await dashboardRepository.createReport(caseId);

    res.status(202).json(report);
  },
};
