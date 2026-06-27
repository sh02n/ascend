import type { Request, Response } from "express";
import { detectRepository } from "../repositories/detect.repository.js";

export const riskController = {
  async getRisk(req: Request, res: Response) {
    const riskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const risk = await detectRepository.findRiskById(riskId);

    res.status(200).json(risk);
  },
};
