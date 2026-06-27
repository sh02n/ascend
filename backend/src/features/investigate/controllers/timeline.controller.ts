import type { Request, Response } from "express";

export const timelineController = {
  async buildTimeline(req: Request, res: Response) {
    const { caseId } = req.body;

    // TODO: compose timeline events for the investigation flow.
    res.status(202).json({
      message: "Timeline placeholder",
      data: { caseId },
    });
  },
};
