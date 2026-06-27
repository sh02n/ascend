import type { Request, Response } from "express";
import { investigateRepository } from "../repositories/investigate.repository.js";

export const investigationController = {
  async investigate(req: Request, res: Response) {
    const { caseId } = req.body;
    const investigation = await investigateRepository.createInvestigation(caseId);

    // TODO: coordinate evidence, pattern checks, and recommendation generation.
    res.status(202).json({
      message: "Investigation placeholder",
      data: investigation,
    });
  },
};
