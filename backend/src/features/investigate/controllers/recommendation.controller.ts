import type { Request, Response } from "express";

export const recommendationController = {
  async explain(req: Request, res: Response) {
    const { caseId } = req.body;

    // TODO: add OpenAI explanation and recommendation orchestration here.
    res.status(202).json({
      message: "Recommendation placeholder",
      data: { caseId },
    });
  },
};
