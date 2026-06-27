import type { Request, Response } from "express";
import { createConsumerAnalysis } from "../services/consumerVerification.service.js";
import { consumerVerifyResponseSchema, verifyConsumerRequestSchema } from "../types/index.js";

export async function verifyConsumerProduct(req: Request, res: Response) {
  const payload = verifyConsumerRequestSchema.parse(req.body);
  const analysis = await createConsumerAnalysis(payload.productUrl);
  const response = consumerVerifyResponseSchema.parse({
    analysisId: analysis.analysisId,
  });

  res.status(201).json(response);
}
