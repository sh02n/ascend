import type { Request, Response } from "express";
import { detectRepository } from "../repositories/detect.repository.js";

export const signalController = {
  async getSignal(req: Request, res: Response) {
    const signal = await detectRepository.findSignalById(req.params.id);

    // TODO: add signal enrichment and burst interpretation here.
    res.status(200).json(signal);
  },
};
