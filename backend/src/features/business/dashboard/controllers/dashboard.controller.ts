import type { Request, Response } from "express";
import { dashboardRepository } from "../repositories/dashboard.repository.js";

export const dashboardController = {
  async getDashboard(_req: Request, res: Response) {
    // TODO: prepare graph, case, and summary payloads for the dashboard.
    const summary = await dashboardRepository.getDashboardSummary();

    res.status(200).json(summary);
  },
};
