import type { DetectionResult } from "./DetectionResult.js";

export interface ReviewRingMetrics {
  reviews: number;
  windowMinutes: number | null;
  affectedBuyers: number;
  sellerConcentration: number;
}

export interface ReviewRingContext extends DetectionResult<ReviewRingMetrics> {
  sellerId: string | null;
  concentratedBuyerIds: string[];
  concentratedReviewIds: string[];
}
