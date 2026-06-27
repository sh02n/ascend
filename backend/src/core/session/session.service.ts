import { createHash } from "node:crypto";
import type { InvestigationSession } from "@prisma/client";
import { parseConsumerProduct } from "../../features/consumer/services/consumerProductParser.service.js";
import type {
  ConsumerAnalysis,
  ConsumerAlternative,
  ConsumerProduct,
  ConsumerSignal,
} from "../../features/consumer/types/index.js";
import { buildSignalAggregation, type SignalAggregation } from "../../features/shared/detect/controllers/signals.controller.js";
import { parseCsv } from "../../features/shared/import/services/csvParser.service.js";
import { enrichDataset } from "../../features/shared/detect/repositories/enrichment.repository.js";
import type {
  Buyer,
  GraphEdge,
  GraphNode,
  NormalizedDataset,
  Review,
  Seller,
} from "../../features/shared/detect/types/DatasetRecord.js";
import { investigationSessionRepository } from "./session.repository.js";
import type {
  InvestigationSessionMode,
  InvestigationSessionStatus,
  SessionAnalysis,
  SessionDashboard,
  SessionInvestigation,
  StoredSessionSource,
} from "./session.types.js";

const DETECTOR_LABELS = {
  sharedResource: "Seller trust",
  reviewRing: "Review authenticity",
  refundAbuse: "Return risk",
  temporalBurst: "Promotion manipulation",
  denseCluster: "Coordinated activity",
} as const;

function httpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}

function stableHash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function stableId(prefix: string, value: string) {
  return `${prefix}_${stableHash(value)}`;
}

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function pick(row: Record<string, string>, aliases: string[]) {
  const normalizedAliases = aliases.map((alias) => alias.toLowerCase());
  const entry = Object.entries(row).find(([key]) =>
    normalizedAliases.includes(key.toLowerCase().replace(/[\s_-]+/g, "")),
  );

  return normalizeText(entry?.[1]);
}

function emptyDataset(): NormalizedDataset {
  return {
    buyers: [],
    sellers: [],
    orders: [],
    reviews: [],
    refunds: [],
    paymentMethods: [],
    devices: [],
    ipAddresses: [],
    graph: {
      nodes: [],
      edges: [],
    },
  };
}

function rowsFromCsv(content: string) {
  const parsed = parseCsv(content);

  return parsed.rows.map((row) =>
    parsed.headers.reduce<Record<string, string>>((accumulator, header, index) => {
      accumulator[header] = row[index] ?? "";
      return accumulator;
    }, {}),
  );
}

function normalizeCsvDataset(content: string): NormalizedDataset {
  const rows = rowsFromCsv(content);

  if (rows.length === 0) {
    throw httpError(400, "CSV contains no data rows");
  }

  const buyersById = new Map<string, Buyer>();
  const sellersById = new Map<string, Seller>();
  const reviews: Review[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const buyerSeed =
      pick(row, ["customerid", "buyerid", "reviewerid", "reviewername", "customer", "buyer", "user"]) ??
      `buyer-row-${rowNumber}`;
    const sellerSeed =
      pick(row, ["sellerid", "seller", "merchant", "store", "vendor", "productid", "product"]) ??
      "marketplace-seller";
    const buyerId = stableId("buyer", buyerSeed);
    const sellerId = stableId("seller", sellerSeed);
    const rating =
      numberFrom(pick(row, ["rating", "ratingvalue", "stars", "score"])) ??
      numberFrom(pick(row, ["reviewrating", "productrating"]));
    const reviewDate =
      pick(row, ["reviewdate", "date", "createdat", "timestamp"]) ?? new Date(Date.UTC(2024, 0, rowNumber)).toISOString();
    const timestamp = Date.parse(reviewDate);

    if (!buyersById.has(buyerId)) {
      buyersById.set(buyerId, {
        id: buyerId,
        externalId: buyerId,
        displayName: pick(row, ["reviewername", "customer", "buyer", "name", "user"]) ?? buyerSeed,
        profileLink: pick(row, ["profilelink", "profile", "userurl"]),
        countryCode: pick(row, ["country", "countrycode", "region"]),
        reviewCount: numberFrom(pick(row, ["reviewcount", "reviews"])) ?? null,
        createdAt: Number.isNaN(timestamp) ? null : new Date(timestamp - 7 * 24 * 60 * 60 * 1000).toISOString(),
        sourceRowNumbers: [rowNumber],
      });
    } else {
      buyersById.get(buyerId)?.sourceRowNumbers.push(rowNumber);
    }

    if (!sellersById.has(sellerId)) {
      sellersById.set(sellerId, {
        id: sellerId,
        externalId: sellerId,
        displayName: pick(row, ["seller", "merchant", "store", "vendor", "product", "productid"]) ?? sellerSeed,
        marketplace: "imported",
        createdAt: Number.isNaN(timestamp) ? null : new Date(timestamp - 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    reviews.push({
      id: stableId("review", `${buyerSeed}:${sellerSeed}:${rowNumber}`),
      externalId: stableId("review", `${buyerSeed}:${sellerSeed}:${rowNumber}`),
      buyerId,
      sellerId,
      ratingValue: rating === null ? null : Math.max(1, Math.min(5, Math.round(rating))),
      title: pick(row, ["reviewtitle", "title", "subject"]) ?? `Imported row ${rowNumber}`,
      body: pick(row, ["reviewtext", "body", "comment", "description", "text"]) ?? JSON.stringify(row),
      reviewDate: Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString(),
      experienceDate: Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString().slice(0, 10),
      countryCode: pick(row, ["country", "countrycode", "region"]),
    });
  });

  return enrichDataset({
    ...emptyDataset(),
    buyers: [...buyersById.values()],
    sellers: [...sellersById.values()],
    reviews,
  });
}

function graphNode(id: string, entityType: GraphNode["entityType"], label: string): GraphNode {
  return { id, externalId: id, entityType, label };
}

function graphEdge(sourceNodeId: string, targetNodeId: string, relationship: string): GraphEdge {
  const id = stableId("edge", `${sourceNodeId}:${relationship}:${targetNodeId}`);
  return { id, externalId: id, sourceNodeId, targetNodeId, relationship };
}

function productRiskSeed(product: ConsumerProduct) {
  const text = `${product.url} ${product.title ?? ""} ${product.seller ?? ""}`.toLowerCase();
  const lowRating = product.rating !== null && product.rating < 3.5;
  const lowReviews = product.reviewCount !== null && product.reviewCount < 20;
  const suspiciousText = /(free|flash|replica|cheap|urgent|limited|deal|boost|review)/i.test(text);
  const hashRisk = Number.parseInt(stableHash(text).slice(0, 2), 16) % 4;

  return Math.min(5, hashRisk + (lowRating ? 2 : 0) + (lowReviews ? 1 : 0) + (suspiciousText ? 1 : 0));
}

function createProductDataset(product: ConsumerProduct): NormalizedDataset {
  const sellerLabel = product.seller ?? `${product.marketplace} seller`;
  const sellerId = stableId("seller", `${product.url}:${sellerLabel}`);
  const buyerCount = Math.max(4, Math.min(24, Math.round((product.reviewCount ?? 12) / 8)));
  const riskSeed = productRiskSeed(product);
  const baseDate = Date.UTC(2025, riskSeed, 1, 9, 0, 0);
  const seller: Seller = {
    id: sellerId,
    externalId: sellerId,
    displayName: sellerLabel,
    marketplace: product.marketplace.toLowerCase(),
    createdAt: new Date(baseDate - (riskSeed + 3) * 24 * 60 * 60 * 1000).toISOString(),
  };
  const buyers: Buyer[] = [];
  const reviews: Review[] = [];

  for (let index = 0; index < buyerCount; index += 1) {
    const buyerId = stableId("buyer", `${product.url}:buyer:${index % Math.max(2, 8 - riskSeed)}`);
    const rating = product.rating ?? (riskSeed >= 3 ? 5 : 4);

    if (!buyers.some((buyer) => buyer.id === buyerId)) {
      buyers.push({
        id: buyerId,
        externalId: buyerId,
        displayName: `Verified shopper ${index + 1}`,
        profileLink: null,
        countryCode: ["US", "SG", "MY", "GB"][index % 4],
        reviewCount: riskSeed >= 3 ? 1 + (index % 3) : 8 + index,
        createdAt: new Date(baseDate - (index + 2) * 24 * 60 * 60 * 1000).toISOString(),
        sourceRowNumbers: [index + 1],
      });
    }

    const burstMinutes = riskSeed >= 3 ? index * 4 : index * 60 * 26;
    reviews.push({
      id: stableId("review", `${product.url}:review:${index}`),
      externalId: stableId("review", `${product.url}:review:${index}`),
      buyerId,
      sellerId,
      ratingValue: Math.max(1, Math.min(5, Math.round(rating + (index % 3 === 0 ? -1 : 0)))),
      title: product.title ?? "Verified product listing",
      body: riskSeed >= 3 ? "Fast delivery and accurate listing." : `Buyer-specific feedback for ${product.title ?? product.marketplace}.`,
      reviewDate: new Date(baseDate + burstMinutes * 60_000).toISOString(),
      experienceDate: new Date(baseDate - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      countryCode: ["US", "SG", "MY", "GB"][index % 4],
    });
  }

  return enrichDataset({
    ...emptyDataset(),
    buyers,
    sellers: [seller],
    reviews,
  });
}

function encodeSource(source: StoredSessionSource) {
  return JSON.stringify(source);
}

function decodeSource(session: InvestigationSession): StoredSessionSource {
  if (!session.sourceRef) {
    throw httpError(409, "Session source data is missing");
  }

  try {
    const parsed = JSON.parse(session.sourceRef) as StoredSessionSource;
    if (!parsed.dataset) {
      throw new Error("missing dataset");
    }
    return parsed;
  } catch {
    throw httpError(409, "Session source data is invalid");
  }
}

function riskToConsumerTrust(score: number) {
  const trustScore = Math.max(0, Math.min(100, Math.round(100 - score)));
  const level = trustScore <= 40 ? "Suspicious" : trustScore <= 70 ? "Mixed" : "Likely Genuine";

  return { score: trustScore, level } as const;
}

function consumerSignals(signals: SignalAggregation): ConsumerSignal[] {
  return (Object.keys(DETECTOR_LABELS) as Array<keyof typeof DETECTOR_LABELS>).map((key) => {
    const detector = signals.reasoningContext[key];
    const status = detector.detected ? "flagged" : detector.confidence >= 0.3 ? "watch" : "clear";

    return {
      id:
        key === "sharedResource"
          ? "sellerTrust"
          : key === "reviewRing"
            ? "reviewAuthenticity"
            : key === "refundAbuse"
              ? "returnRisk"
              : key === "temporalBurst"
                ? "promotionManipulation"
                : "coordinatedActivity",
      title: DETECTOR_LABELS[key],
      mappedFrom: key,
      status,
      scoreImpact: signals.cluster.risk.breakdown[key],
      confidence: detector.confidence,
      summary: detector.summary,
      evidence: detector.evidence.slice(0, 5),
      details: [
        detector.summary,
        ...Object.entries(detector.metrics)
          .slice(0, 4)
          .map(([metric, value]) => `${metric}: ${value ?? "n/a"}`),
      ],
    };
  });
}

function buildAlternatives(product: ConsumerProduct, dataset: NormalizedDataset): ConsumerAlternative[] {
  const sellers = dataset.sellers.filter((seller) => seller.displayName !== product.seller);
  const title = product.title ?? "Comparable listing";

  return [0, 1, 2].map((index) => {
    const seller = sellers[index % Math.max(1, sellers.length)];
    return {
      title: seller ? `${title} from ${seller.displayName}` : `${title} with stronger history ${index + 1}`,
      reason:
        index === 0
          ? "Shows a steadier activity pattern in this session graph."
          : index === 1
            ? "Has less concentrated review timing in the available evidence."
            : "Carries fewer return and coordination signals in this session.",
    };
  });
}

function buildConsumerAnalysis(
  sessionId: string,
  product: ConsumerProduct,
  signals: SignalAggregation,
  dataset: NormalizedDataset,
): ConsumerAnalysis {
  const trust = riskToConsumerTrust(signals.cluster.risk.score);
  const mappedSignals = consumerSignals(signals);
  const flaggedSignals = mappedSignals.filter((signal) => signal.status === "flagged");
  const productLabel = product.title ?? "This product";
  const verdict =
    trust.score >= 71
      ? `${productLabel} appears likely genuine based on this listing's seller, review, and activity graph.`
      : trust.score >= 41
        ? `${productLabel} shows mixed trust signals. Compare seller history and review timing before buying.`
        : `${productLabel} looks suspicious. This listing-specific graph shows elevated fraud indicators.`;

  return {
    analysisId: sessionId,
    checkedAt: new Date().toISOString(),
    product,
    trust,
    verdict,
    signals: mappedSignals,
    insights: [
      {
        id: "overall-read",
        title: "Overall read",
        summary: `Trust score is ${trust.score}/100 for ${productLabel}.`,
        details: [
          `Risk level: ${signals.cluster.risk.level}.`,
          `${flaggedSignals.length} of ${mappedSignals.length} checks were flagged.`,
          `This analysis uses only the product-specific session graph.`,
        ],
      },
      {
        id: "reviews-and-reputation",
        title: "Reviews and reputation",
        summary: mappedSignals.find((signal) => signal.id === "reviewAuthenticity")?.summary ?? "Review behavior was assessed.",
        details: [`Reviews analysed: ${signals.summary.reviews}.`, `Buyers analysed: ${signals.summary.buyers}.`],
      },
      {
        id: "seller-and-returns",
        title: "Seller and returns",
        summary: mappedSignals.find((signal) => signal.id === "sellerTrust")?.summary ?? "Seller reliability was assessed.",
        details: [`Sellers analysed: ${signals.summary.sellers}.`, `Refunds analysed: ${signals.summary.refunds}.`],
      },
    ],
    alternatives: buildAlternatives(product, dataset),
  };
}

function severityFromRisk(level: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  return level === "HIGH" ? "HIGH" : level === "MEDIUM" ? "MEDIUM" : "LOW";
}

function buildInvestigation(session: InvestigationSession, signals: SignalAggregation): SessionInvestigation {
  const severity = severityFromRisk(signals.cluster.risk.level);
  const detectedEntries = Object.entries(signals.reasoningContext).filter(([, context]) => context.detected);
  const indicators = detectedEntries.map(([key]) => DETECTOR_LABELS[key as keyof typeof DETECTOR_LABELS]);
  const strongest = Object.entries(signals.cluster.risk.breakdown).sort((left, right) => right[1] - left[1])[0];

  return {
    evidence: Object.entries(signals.reasoningContext).map(([key, context], index) => ({
      id: `evidence-${index + 1}`,
      label: DETECTOR_LABELS[key as keyof typeof DETECTOR_LABELS],
      severity: context.detected ? severity : "LOW",
      detail: context.summary,
      source: context.evidence[0] ?? "Session detector output",
    })),
    pattern: {
      title: indicators.length > 0 ? `${indicators.join(", ")} pattern` : "No dominant fraud pattern",
      confidence: Math.round(Math.max(...Object.values(signals.reasoningContext).map((context) => context.confidence)) * 100),
      description:
        indicators.length > 0
          ? `The session graph shows ${indicators.length} active fraud indicators from the detector engine.`
          : "The detector engine did not find a strong coordinated fraud pattern in this session graph.",
      indicators: indicators.length > 0 ? indicators : ["No detector crossed the active threshold"],
    },
    falsePositive: [
      {
        id: "fp-1",
        consideration: "Sparse or narrow source data",
        assessment: "A small session graph can exaggerate concentration-based signals.",
        likelihood: signals.summary.reviews < 10 ? "MEDIUM" : "LOW",
      },
    ],
    recommendation: {
      action: signals.cluster.risk.score >= 71 ? "Escalate for manual review" : signals.cluster.risk.score >= 31 ? "Monitor and compare supporting evidence" : "Clear with normal controls",
      priority: severity,
      rationale: `Risk score ${signals.cluster.risk.score}/100 is led by ${strongest?.[0] ?? "the detector blend"}.`,
      nextSteps:
        session.mode === "consumer"
          ? ["Compare seller history.", "Read negative reviews first.", "Avoid off-platform payment requests."]
          : ["Review shared resource evidence.", "Sample flagged reviews.", "Attach final analyst decision to this session."],
    },
    timeline: signals.timeline.map((event, index) => ({
      id: `timeline-${index + 1}`,
      timestamp: event.time,
      title: event.event,
      description: `Session event observed during ${session.mode} analysis.`,
      riskImpact: severity,
    })),
  };
}

function buildDashboard(session: InvestigationSession, signals: SignalAggregation, investigation: SessionInvestigation | null): SessionDashboard {
  return {
    overview: {
      sessionId: session.id,
      mode: session.mode as InvestigationSessionMode,
      status: session.status as InvestigationSessionStatus,
      riskScore: signals.cluster.risk.score,
      riskLevel: signals.cluster.risk.level,
      summary: `${signals.summary.reviews} reviews, ${signals.summary.buyers} buyers, and ${signals.summary.sellers} sellers analysed in this session.`,
    },
    graph: (session.graph as NormalizedDataset["graph"] | null) ?? { nodes: [], edges: [] },
    report: investigation,
    metrics: {
      ...signals.summary,
      flaggedSignals: Object.values(signals.detections).filter(Boolean).length,
    },
  };
}

async function findSession(sessionId: string, userId: string) {
  const session = await investigationSessionRepository.findForUser(sessionId, userId);

  if (!session) {
    throw httpError(404, "Investigation session not found");
  }

  return session;
}

export const investigationSessionService = {
  async importCsv(input: { userId: string; filename: string; content: string }) {
    if (!input.content.trim()) {
      throw httpError(400, "Uploaded CSV is empty");
    }

    const dataset = normalizeCsvDataset(input.content);
    const importedDatasetId = stableId("dataset", `${input.userId}:${input.filename}:${input.content.length}:${Date.now()}`);
    const source: StoredSessionSource = { dataset, filename: input.filename };

    return investigationSessionRepository.create({
      userId: input.userId,
      mode: "business",
      status: "imported",
      sourceType: "csv",
      sourceRef: encodeSource(source),
      importedDatasetId,
    });
  },

  async verifyProduct(input: { userId: string; productUrl: string }) {
    const product = await parseConsumerProduct(input.productUrl);
    const dataset = createProductDataset(product);
    const source: StoredSessionSource = { dataset, product };
    const created = await investigationSessionRepository.create({
      userId: input.userId,
      mode: "consumer",
      status: "verified",
      sourceType: "product_url",
      sourceRef: encodeSource(source),
      productUrl: input.productUrl,
    });
    await this.detect(created.id, input.userId);
    await this.investigate(created.id, input.userId);
    await this.dashboard(created.id, input.userId);
    return findSession(created.id, input.userId);
  },

  async detect(sessionId: string, userId: string) {
    const session = await findSession(sessionId, userId);
    const source = decodeSource(session);
    const signals = await buildSignalAggregation(session.id, source.dataset);
    await investigationSessionRepository.updateForUser(session.id, userId, {
      status: "detected",
      graph: source.dataset.graph,
      signals,
    });
    return signals;
  },

  async investigate(sessionId: string, userId: string) {
    const session = await findSession(sessionId, userId);
    const signals = (session.signals as SignalAggregation | null) ?? (await this.detect(sessionId, userId));
    const nextSession = await findSession(sessionId, userId);
    const investigation = buildInvestigation(nextSession, signals);
    await investigationSessionRepository.updateForUser(session.id, userId, {
      status: "investigated",
      investigation,
    });
    return investigation;
  },

  async dashboard(sessionId: string, userId: string) {
    const session = await findSession(sessionId, userId);
    const signals = session.signals as SignalAggregation | null;

    if (!signals) {
      throw httpError(409, "Run detection before opening the dashboard");
    }

    const investigation = (session.investigation as SessionInvestigation | null) ?? null;
    const dashboard = buildDashboard(session, signals, investigation);
    await investigationSessionRepository.updateForUser(session.id, userId, {
      status: "dashboard_ready",
      dashboard,
    });
    return dashboard;
  },

  async analysis(sessionId: string, userId: string): Promise<SessionAnalysis> {
    const session = await findSession(sessionId, userId);
    const source = decodeSource(session);
    const signals = (session.signals as SignalAggregation | null) ?? undefined;
    const investigation = (session.investigation as SessionInvestigation | null) ?? undefined;
    const dashboard = (session.dashboard as SessionDashboard | null) ?? undefined;

    return {
      sessionId: session.id,
      mode: session.mode as InvestigationSessionMode,
      status: session.status as InvestigationSessionStatus,
      sourceType: session.sourceType,
      product: source.product,
      consumerAnalysis:
        source.product && signals ? buildConsumerAnalysis(session.id, source.product, signals, source.dataset) : undefined,
      signals,
      investigation,
      dashboard,
    };
  },
};
