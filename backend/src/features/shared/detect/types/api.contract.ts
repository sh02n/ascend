import { z } from "zod";

export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const riskBreakdownSchema = z.object({
  sharedResource: z.number(),
  reviewRing: z.number(),
  refundAbuse: z.number(),
  temporalBurst: z.number(),
  denseCluster: z.number(),
});

export const riskSchema = z.object({
  score: z.number().min(0).max(100),
  level: riskLevelSchema,
  breakdown: riskBreakdownSchema,
});

export const detectorContextSchema = z
  .object({
    detected: z.boolean(),
    score: z.number(),
    confidence: z.number().min(0).max(1),
    summary: z.string(),
    metrics: z.record(z.union([z.number(), z.string(), z.boolean(), z.null()])),
    evidence: z.array(z.string()),
  })
  .passthrough();

export const signalResponseSchema = z.object({
  cluster: z.object({
    id: z.string(),
    risk: riskSchema,
  }),
  summary: z.object({
    buyers: z.number(),
    sellers: z.number(),
    orders: z.number(),
    reviews: z.number(),
    refunds: z.number(),
  }),
  detections: z.object({
    sharedResource: z.boolean(),
    reviewRing: z.boolean(),
    refundAbuse: z.boolean(),
    temporalBurst: z.boolean(),
    denseCluster: z.boolean(),
  }),
  reasoningContext: z.object({
    sharedResource: detectorContextSchema,
    reviewRing: detectorContextSchema,
    refundAbuse: detectorContextSchema,
    temporalBurst: detectorContextSchema,
    denseCluster: detectorContextSchema,
  }),
  timeline: z.array(
    z.object({
      time: z.string(),
      event: z.string(),
    }),
  ),
});

export const riskResponseSchema = z.object({
  clusterId: z.string(),
  score: z.number().min(0).max(100),
  level: riskLevelSchema,
  breakdown: riskBreakdownSchema,
});

export const clusterResponseSchema = z.array(
  z.object({
    id: z.string(),
    score: z.number().min(0).max(100),
    level: riskLevelSchema,
  }),
);

export type SignalResponse = z.infer<typeof signalResponseSchema>;
export type RiskResponse = z.infer<typeof riskResponseSchema>;
export type ClusterResponse = z.infer<typeof clusterResponseSchema>;
