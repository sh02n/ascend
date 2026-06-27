import type { NormalizedDataset, Review } from "../types/DatasetRecord.js";
import type { ReviewRingContext } from "../types/ReviewRingContext.js";
import { getDataset } from "../repositories/dataset.repository.js";

const REVIEW_RING_SCORE = 20;
const REVIEW_COUNT_THRESHOLD = 10;
const REVIEW_WINDOW_THRESHOLD_MINUTES = 15;
const CONCENTRATION_THRESHOLD = 0.7;

interface SellerReviewGroup {
  sellerId: string;
  reviews: Review[];
  buyerIds: Set<string>;
}

function confidenceForReviewCount(reviewCount: number) {
  if (reviewCount >= 50) {
    return 0.92;
  }

  if (reviewCount >= 20) {
    return 0.8;
  }

  if (reviewCount >= 10) {
    return 0.6;
  }

  return 0;
}

function minutesBetween(startTimestamp: number, endTimestamp: number) {
  return Math.round(((endTimestamp - startTimestamp) / 60_000) * 100) / 100;
}

function findTightestReviewWindow(reviews: Review[]) {
  const timestamps = reviews
    .map((review) => (review.reviewDate ? Date.parse(review.reviewDate) : Number.NaN))
    .filter((timestamp) => !Number.isNaN(timestamp))
    .sort((left, right) => left - right);

  if (timestamps.length < 2) {
    return null;
  }

  let tightestWindowMinutes: number | null = null;

  for (let index = 1; index < timestamps.length; index += 1) {
    const windowMinutes = minutesBetween(timestamps[index - 1], timestamps[index]);

    if (tightestWindowMinutes === null || windowMinutes < tightestWindowMinutes) {
      tightestWindowMinutes = windowMinutes;
    }
  }

  return tightestWindowMinutes;
}

function groupReviewsBySeller(reviews: Review[]) {
  const groupsBySeller = new Map<string, SellerReviewGroup>();

  for (const review of reviews) {
    if (!review.sellerId) {
      continue;
    }

    const group =
      groupsBySeller.get(review.sellerId) ??
      ({
        sellerId: review.sellerId,
        reviews: [],
        buyerIds: new Set<string>(),
      } satisfies SellerReviewGroup);

    group.reviews.push(review);

    if (review.buyerId) {
      group.buyerIds.add(review.buyerId);
    }

    groupsBySeller.set(review.sellerId, group);
  }

  return [...groupsBySeller.values()];
}

export function detectReviewRingFromDataset(dataset: NormalizedDataset): ReviewRingContext {
  const groups = groupReviewsBySeller(dataset.reviews);
  const buyersWithReviews = new Set(
    dataset.reviews.map((review) => review.buyerId).filter((buyerId): buyerId is string => Boolean(buyerId)),
  );
  const totalBuyerCount = buyersWithReviews.size;

  let strongestGroup: SellerReviewGroup | null = null;
  let strongestWindowMinutes: number | null = null;
  let strongestConcentration = 0;

  for (const group of groups) {
    const windowMinutes = findTightestReviewWindow(group.reviews);
    const concentration = totalBuyerCount > 0 ? group.buyerIds.size / totalBuyerCount : 0;
    const groupIsStronger =
      !strongestGroup ||
      group.reviews.length > strongestGroup.reviews.length ||
      (group.reviews.length === strongestGroup.reviews.length && concentration > strongestConcentration);

    if (groupIsStronger) {
      strongestGroup = group;
      strongestWindowMinutes = windowMinutes;
      strongestConcentration = concentration;
    }
  }

  const reviewCount = strongestGroup?.reviews.length ?? 0;
  const affectedBuyers = strongestGroup?.buyerIds.size ?? 0;
  const repeatedTimingDetected =
    strongestWindowMinutes !== null && strongestWindowMinutes <= REVIEW_WINDOW_THRESHOLD_MINUTES;
  const manyBuyersSingleSellerDetected = reviewCount >= REVIEW_COUNT_THRESHOLD;
  const concentrationDetected = strongestConcentration >= CONCENTRATION_THRESHOLD;
  const detected = manyBuyersSingleSellerDetected || repeatedTimingDetected || concentrationDetected;

  return {
    detected,
    score: detected ? REVIEW_RING_SCORE : 0,
    confidence: detected ? confidenceForReviewCount(reviewCount) : 0,
    summary: detected
      ? "Review activity concentrated around one seller"
      : "No review ring pattern found",
    metrics: {
      reviews: reviewCount,
      windowMinutes: strongestWindowMinutes,
      affectedBuyers,
      sellerConcentration: Math.round(strongestConcentration * 100) / 100,
    },
    evidence: strongestGroup && detected ? [strongestGroup.sellerId] : [],
    sellerId: strongestGroup?.sellerId ?? null,
    concentratedBuyerIds: strongestGroup ? [...strongestGroup.buyerIds].sort() : [],
    concentratedReviewIds: strongestGroup ? strongestGroup.reviews.map((review) => review.id).sort() : [],
  };
}

export async function detectReviewRing(
  dataset?: NormalizedDataset,
): Promise<ReviewRingContext> {
  const detectionDataset = dataset ?? (await getDataset());

  return detectReviewRingFromDataset(detectionDataset);
}
