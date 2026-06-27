import type { Request, Response } from "express";
import { compareConsumerListings } from "../services/consumerComparison.service.js";
import { compareConsumerListingsRequestSchema, consumerListingComparisonSchema } from "../types/index.js";

export async function compareConsumerListingsController(req: Request, res: Response) {
  const payload = compareConsumerListingsRequestSchema.parse(req.body);
  const result = await compareConsumerListings(payload.urlA, payload.urlB);
  res.status(200).json(consumerListingComparisonSchema.parse(result));
}
