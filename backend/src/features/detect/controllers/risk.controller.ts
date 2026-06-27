import type { Request, Response } from "express";
import { detectRepository } from "../repositories/detect.repository.js";

export const riskController = {
  async getRisk(req: Request, res: Response) {
    const risk = await detectRepository.findRiskById(req.params.id);

    // TODO: add risk scoring logic here.
    res.status(200).json(risk);
  },
};
