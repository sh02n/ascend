import type { Request, Response } from "express";
import { detectRepository } from "../repositories/detect.repository.js";

export const clusterController = {
  async getClusters(_req: Request, res: Response) {
    // TODO: add cluster analysis and shared-resource review logic here.
    const clusters = await detectRepository.listClusters();

    res.status(200).json(clusters);
  },
};
