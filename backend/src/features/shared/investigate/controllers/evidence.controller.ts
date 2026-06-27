import type { Request, Response } from "express";

export const evidenceController = {
  async explainEvidence(req: Request, res: Response) {
    const { caseId } = req.body;

    // TODO: gather evidence artifacts and attach supporting references.
    res.status(202).json({
      message: "Evidence explanation placeholder",
      data: { caseId },
    });
  },
};
