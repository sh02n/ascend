import { randomUUID } from "node:crypto";
import { getDataset } from "../../shared/detect/repositories/dataset.repository.js";
import type { NormalizedDataset, Review, Seller } from "../../shared/detect/types/DatasetRecord.js";
import { buildSignalAggregation } from "../../shared/detect/controllers/signal.controller.js";
import type { ConsumerAnalysis, ConsumerAlternative, ConsumerInsight, ConsumerProduct, ConsumerSignal } from "../types/index.js";
import { saveConsumerAnalysis } from "./consumerAnalysisStore.service.js";
import { parseConsumerProduct } from "./consumerProductParser.service.js";

const SIGNAL_COPY: Record<
  ConsumerSignal["id"],
  { title: string; mappedFrom: ConsumerSignal["mappedFrom"]; clear: string; flagged: string }
> = {
  sellerTrust: {
    title: "Seller trust",
    mappedFrom: "sharedResource",
    clear: "Seller activity does not show broad account sharing patterns.",
    flagged: "Seller activity overlaps with other accounts in ways that often accompany marketplace abuse.",
  },
  reviewAuthenticity: {
    title: "Review authenticity",
    mappedFrom: "reviewRing",
    clear: "Review activity looks more organic than coordinated.",
    flagged: "Review timing and concentration suggest unnatural amplification.",
  },
  returnRisk: {
    title: "Return risk",
    mappedFrom: "refundAbuse",
    clear: "Refund behavior stays within a normal range in the shared dataset.",
    flagged: "Refund behavior is elevated enough to suggest higher post-purchase friction.",
  },
  promotionManipulation: {
    title: "Promotion manipulation",
    mappedFrom: "temporalBurst",
    clear: "Promotions and activity bursts do not stand out as aggressive.",
    flagged: "Short bursts of activity may indicate manufactured momentum or campaign spikes.",
  },
  coordinatedActivity: {
    title: "Coordinated activity",
    mappedFrom: "denseCluster",
    clear: "The network around this pattern is not unusually interconnected.",
    flagged: "Multiple entities appear tightly linked, which can point to coordinated behavior.",
  },
};

function clampScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function trustLevelForScore(score: number) {
  if (score <= 40) {
    return "Suspicious" as const;
  }

  if (score <= 70) {
    return "Mixed" as const;
  }

  return "Likely Genuine" as const;
}

function sentenceCaseLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatMetricValue(value: unknown) {
  if (value === null || value === undefined) {
    return "n/a";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2);
  }

  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }

  return String(value);
}

function buildSignalDetails(summary: string, metrics: object, evidence: string[]) {
  const metricLines = Object.entries(metrics as Record<string, unknown>)
    .slice(0, 4)
    .map(([key, value]) => `${sentenceCaseLabel(key)}: ${formatMetricValue(value)}`);
  const evidenceLines = evidence.slice(0, 3).map((item) => `Evidence: ${item}`);

  return [summary, ...metricLines, ...evidenceLines];
}

function buildConsumerSignals(aggregation: Awaited<ReturnType<typeof buildSignalAggregation>>) {
  const breakdown = aggregation.cluster.risk.breakdown;

  const signalMap: Array<ConsumerSignal["id"]> = [
    "sellerTrust",
    "reviewAuthenticity",
    "returnRisk",
    "promotionManipulation",
    "coordinatedActivity",
  ];

  return signalMap.map((signalId) => {
    const copy = SIGNAL_COPY[signalId];
    const detector = aggregation.reasoningContext[copy.mappedFrom];
    const scoreImpact = breakdown[copy.mappedFrom];
    const status = detector.detected ? "flagged" : detector.confidence >= 0.3 ? "watch" : "clear";

    return {
      id: signalId,
      title: copy.title,
      mappedFrom: copy.mappedFrom,
      status,
      scoreImpact,
      confidence: detector.confidence,
      summary: detector.detected ? copy.flagged : copy.clear,
      evidence: detector.evidence.slice(0, 5),
      details: buildSignalDetails(detector.summary, detector.metrics, detector.evidence),
    } satisfies ConsumerSignal;
  });
}

function buildVerdict(product: ConsumerProduct, trustScore: number, flaggedSignals: ConsumerSignal[]) {
  const productLabel = product.title ?? "This product";

  if (trustScore >= 71) {
    if (flaggedSignals.length === 0) {
      return `${productLabel} appears likely genuine. Seller activity and review behavior look broadly organic.`;
    }

    return `${productLabel} appears likely genuine overall, though a few signals still deserve a quick double-check before purchase.`;
  }

  if (trustScore >= 41) {
    return `${productLabel} shows mixed trust signals. Some activity looks normal, but there are enough irregular patterns to compare carefully before buying.`;
  }

  return `${productLabel} looks suspicious. The shared fraud patterns suggest elevated risk around seller behavior, review quality, or coordinated activity.`;
}

function buildInsights(
  product: ConsumerProduct,
  trustScore: number,
  signals: ConsumerSignal[],
  aggregation: Awaited<ReturnType<typeof buildSignalAggregation>>,
): ConsumerInsight[] {
  const flaggedSignals = signals.filter((signal) => signal.status === "flagged");
  const productName = product.title ?? "this listing";

  return [
    {
      id: "overall-read",
      title: "Overall read",
      summary: `Trust score is ${trustScore}/100 for ${productName}.`,
      details: [
        `Verdict level: ${trustScore >= 71 ? "Likely Genuine" : trustScore >= 41 ? "Mixed" : "Suspicious"}.`,
        `${flaggedSignals.length} of ${signals.length} consumer checks were flagged.`,
        `The strongest risk contribution in the shared engine is ${[...signals].sort((left, right) => right.scoreImpact - left.scoreImpact)[0]?.title ?? "seller trust"}.`,
      ],
    },
    {
      id: "reviews-and-reputation",
      title: "Reviews and reputation",
      summary: signals.find((signal) => signal.id === "reviewAuthenticity")?.summary ?? "Review behavior was assessed.",
      details: [
        `Review count in shared dataset: ${aggregation.summary.reviews}.`,
        `Buyer count in shared dataset: ${aggregation.summary.buyers}.`,
        ...signals.find((signal) => signal.id === "reviewAuthenticity")?.details.slice(0, 3) ?? [],
      ],
    },
    {
      id: "seller-and-returns",
      title: "Seller and returns",
      summary: signals.find((signal) => signal.id === "sellerTrust")?.summary ?? "Seller reliability was assessed.",
      details: [
        `Seller count in shared dataset: ${aggregation.summary.sellers}.`,
        `Refund count in shared dataset: ${aggregation.summary.refunds}.`,
        ...signals.find((signal) => signal.id === "returnRisk")?.details.slice(0, 3) ?? [],
      ],
    },
  ];
}

interface SellerStats {
  seller: Seller;
  reviewCount: number;
  averageRating: number | null;
  refundCount: number;
  orderCount: number;
  score: number;
}

function computeSellerStats(dataset: NormalizedDataset) {
  const sellerById = new Map(dataset.sellers.map((seller) => [seller.id, seller]));
  const ordersById = new Map(dataset.orders.map((order) => [order.id, order]));
  const reviewsBySeller = new Map<string, Review[]>();
  const orderCountBySeller = new Map<string, number>();
  const refundCountBySeller = new Map<string, number>();

  for (const review of dataset.reviews) {
    if (!review.sellerId) {
      continue;
    }

    const sellerReviews = reviewsBySeller.get(review.sellerId) ?? [];
    sellerReviews.push(review);
    reviewsBySeller.set(review.sellerId, sellerReviews);
  }

  for (const order of dataset.orders) {
    if (!order.sellerId) {
      continue;
    }

    orderCountBySeller.set(order.sellerId, (orderCountBySeller.get(order.sellerId) ?? 0) + 1);
  }

  for (const refund of dataset.refunds) {
    if (!refund.orderId) {
      continue;
    }

    const order = ordersById.get(refund.orderId);

    if (!order?.sellerId) {
      continue;
    }

    refundCountBySeller.set(order.sellerId, (refundCountBySeller.get(order.sellerId) ?? 0) + 1);
  }

  return dataset.sellers
    .map((seller) => {
      const reviews = reviewsBySeller.get(seller.id) ?? [];
      const ratingValues = reviews
        .map((review) => review.ratingValue)
        .filter((value): value is number => typeof value === "number");
      const averageRating =
        ratingValues.length > 0
          ? Math.round((ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length) * 10) / 10
          : null;
      const reviewCount = reviews.length;
      const orderCount = orderCountBySeller.get(seller.id) ?? 0;
      const refundCount = refundCountBySeller.get(seller.id) ?? 0;
      const refundRate = orderCount > 0 ? refundCount / orderCount : 0;
      const score = (averageRating ?? 3) * 18 + Math.min(reviewCount, 20) * 2 - refundRate * 40;

      return {
        seller,
        reviewCount,
        averageRating,
        refundCount,
        orderCount,
        score,
      } satisfies SellerStats;
    })
    .sort((left, right) => right.score - left.score);
}

function buildAlternatives(product: ConsumerProduct, dataset: NormalizedDataset): ConsumerAlternative[] {
  const lowerSellerName = product.seller?.toLowerCase() ?? "";
  const baseTitle = product.title ?? "Comparable listing";
  const candidates = computeSellerStats(dataset).filter(
    (candidate) => !lowerSellerName || !candidate.seller.displayName.toLowerCase().includes(lowerSellerName),
  );

  const alternatives = candidates.slice(0, 3).map((candidate) => {
    const ratingPart = candidate.averageRating ? `rated ${candidate.averageRating}/5` : "with steady review quality";
    const volumePart =
      candidate.reviewCount > 0 ? `${candidate.reviewCount} reviews in the shared dataset` : "limited but cleaner activity";
    const refundPart =
      candidate.refundCount > 0
        ? `${candidate.refundCount} refund event${candidate.refundCount === 1 ? "" : "s"} observed`
        : "no refund spikes observed";

    return {
      title: `${baseTitle} from ${candidate.seller.displayName}`,
      reason: `${candidate.seller.displayName} is a stronger candidate in the dataset, ${ratingPart}, with ${volumePart} and ${refundPart}.`,
    };
  });

  if (alternatives.length === 3) {
    return alternatives;
  }

  const fallbacks = [
    {
      title: `${baseTitle} with more established seller history`,
      reason: "Shared dataset patterns favor listings backed by older, steadier seller activity instead of sudden bursts.",
    },
    {
      title: `${baseTitle} with steadier review spread`,
      reason: "A safer alternative would show reviews spread across time rather than concentrated in short windows.",
    },
    {
      title: `${baseTitle} from a lower-refund profile`,
      reason: "The shared dataset treats lower refund concentration as a positive signal for buyer experience.",
    },
  ];

  return [...alternatives, ...fallbacks].slice(0, 3);
}

export async function createConsumerAnalysis(productUrl: string): Promise<ConsumerAnalysis> {
  const [product, dataset] = await Promise.all([parseConsumerProduct(productUrl), getDataset()]);
  const aggregation = await buildSignalAggregation("consumer", dataset);
  const trustScore = clampScore(100 - aggregation.cluster.risk.score);
  const signals = buildConsumerSignals(aggregation);
  const flaggedSignals = signals.filter((signal) => signal.status === "flagged");
  const analysis = {
    analysisId: randomUUID(),
    checkedAt: new Date().toISOString(),
    product,
    trust: {
      score: trustScore,
      level: trustLevelForScore(trustScore),
    },
    verdict: buildVerdict(product, trustScore, flaggedSignals),
    signals,
    insights: buildInsights(product, trustScore, signals, aggregation),
    alternatives: buildAlternatives(product, dataset),
  } satisfies ConsumerAnalysis;

  saveConsumerAnalysis(analysis);

  return analysis;
}
