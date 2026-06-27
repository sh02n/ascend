import type { Request, Response } from "express";

export const graphController = {
  async buildGraph(req: Request, res: Response) {
    const { sessionId } = req.body;

    // TODO: orchestrate graph construction from seeded DB entities.
    res.status(202).json({
      message: "Graph build placeholder",
      data: { sessionId, graphReady: false },
    });
  },
};
