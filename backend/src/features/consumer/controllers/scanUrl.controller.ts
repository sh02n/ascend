import type { Request, Response } from "express";
import { scanConsumerUrl } from "../services/consumerUrlScanner.service.js";
import { consumerUrlScanResultSchema, scanConsumerUrlRequestSchema } from "../types/index.js";

export async function scanConsumerUrlController(req: Request, res: Response) {
  const payload = scanConsumerUrlRequestSchema.parse(req.body);
  const result = await scanConsumerUrl(payload.url);
  res.status(200).json(consumerUrlScanResultSchema.parse(result));
}
