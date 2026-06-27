import { z } from "zod";

export const verifyConsumerRequestSchema = z.object({
  productUrl: z.string().trim().url(),
});

export const scanConsumerUrlRequestSchema = z.object({
  url: z.string().trim().url(),
});

export const compareConsumerListingsRequestSchema = z.object({
  urlA: z.string().trim().url(),
  urlB: z.string().trim().url(),
});

export const consumerUrlScanResultSchema = z.object({
  url: z.string().url(),
  domain: z.string(),
  title: z.string(),
  riskScore: z.number().int().min(0).max(100),
  riskLevel: z.enum(["Low", "Medium", "High"]),
  confidence: z.number().int().min(0).max(100),
  summary: z.string(),
  evidence: z.array(z.string()),
  suspiciousSignals: z.array(z.string()),
  recommendation: z.string(),
  extractedSignals: z.object({
    pageTitle: z.string(),
    description: z.string(),
    priceText: z.string().nullable(),
    ratingText: z.string().nullable(),
    reviewText: z.string().nullable(),
    sellerText: z.string().nullable(),
    paymentText: z.string().nullable(),
  }),
});

export const consumerListingComparisonSchema = z.object({
  listingA: consumerUrlScanResultSchema,
  listingB: consumerUrlScanResultSchema,
  comparison: z.object({
    winner: z.enum(["A", "B"]),
    summary: z.string(),
    differences: z.array(z.string()),
  }),
});

export const consumerProductSchema = z.object({
  url: z.string().url(),
  marketplace: z.string(),
  title: z.string().nullable(),
  brand: z.string().nullable(),
  seller: z.string().nullable(),
  rating: z.number().nullable(),
  reviewCount: z.number().int().nullable(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
});

export const consumerTrustSchema = z.object({
  score: z.number().int().min(0).max(100),
  level: z.enum(["Suspicious", "Mixed", "Likely Genuine"]),
});

export const consumerSignalSchema = z.object({
  id: z.enum([
    "sellerTrust",
    "reviewAuthenticity",
    "returnRisk",
    "promotionManipulation",
    "coordinatedActivity",
  ]),
  title: z.string(),
  mappedFrom: z.enum(["sharedResource", "reviewRing", "refundAbuse", "temporalBurst", "denseCluster"]),
  status: z.enum(["clear", "watch", "flagged"]),
  scoreImpact: z.number().int().min(0).max(100),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  evidence: z.array(z.string()),
  details: z.array(z.string()),
});

export const consumerInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  details: z.array(z.string()),
});

export const consumerAlternativeSchema = z.object({
  title: z.string(),
  reason: z.string(),
});

export const consumerAnalysisSchema = z.object({
  analysisId: z.string(),
  checkedAt: z.string(),
  product: consumerProductSchema,
  trust: consumerTrustSchema,
  verdict: z.string(),
  signals: z.array(consumerSignalSchema),
  insights: z.array(consumerInsightSchema),
  alternatives: z.array(consumerAlternativeSchema),
});

export const consumerVerifyResponseSchema = z.object({
  analysisId: z.string(),
});

export type VerifyConsumerRequest = z.infer<typeof verifyConsumerRequestSchema>;
export type ScanConsumerUrlRequest = z.infer<typeof scanConsumerUrlRequestSchema>;
export type CompareConsumerListingsRequest = z.infer<typeof compareConsumerListingsRequestSchema>;
export type ConsumerUrlScanResult = z.infer<typeof consumerUrlScanResultSchema>;
export type ConsumerListingComparison = z.infer<typeof consumerListingComparisonSchema>;
export type ConsumerProduct = z.infer<typeof consumerProductSchema>;
export type ConsumerTrust = z.infer<typeof consumerTrustSchema>;
export type ConsumerSignal = z.infer<typeof consumerSignalSchema>;
export type ConsumerInsight = z.infer<typeof consumerInsightSchema>;
export type ConsumerAlternative = z.infer<typeof consumerAlternativeSchema>;
export type ConsumerAnalysis = z.infer<typeof consumerAnalysisSchema>;
