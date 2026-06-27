import type { Request, Response } from "express";
import { dashboardRepository } from "../repositories/dashboard.repository.js";

export const reportController = {
  async createReport(req: Request, res: Response) {
    const { caseId } = req.body;
    const report = await dashboardRepository.createReport(caseId);

    // TODO: orchestrate report generation and formatting here.
    res.status(202).json(report);
  },
};
