import type { Request, Response } from "express";
import { detectRepository } from "../repositories/detect.repository.js";

export const signalController = {
  async getSignal(req: Request, res: Response) {
    const signalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const signal = await detectRepository.findSignalById(signalId);

    res.status(200).json(signal);
  },
};
