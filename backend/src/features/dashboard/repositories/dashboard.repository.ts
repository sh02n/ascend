import { prisma } from "../../../db/prisma.js";
import type { DashboardPacket } from "../types/index.js";

const fallbackDashboard: DashboardPacket = {
  cluster: {
    id: "cluster_001",
    scenario: "Fake Review Ring",
    risk: {
      score: 91,
      level: "HIGH",
      breakdown: {
        sharedResource: 25,
        reviewRing: 20,
        refundAbuse: 10,
        temporalBurst: 15,
        denseCluster: 21,
      },
    },
  },
  summary: {
    buyers: 18,
    sellers: 1,
    orders: 84,
    reviews: 73,
    refunds: 12,
    chargebacks: 1,
  },
  primaryEntities: {
    sellerId: "seller_23",
    buyerIds: ["buyer_001", "buyer_002", "buyer_003"],
    productIds: ["asin_B001"],
  },
  detections: [
    {
      key: "sharedResource",
      label: "Shared resource abuse",
      confidence: 0.95,
      summary: "Multiple accounts share payment methods, devices, and IP addresses.",
      metrics: { sharedPayments: 3, sharedIPs: 2, sharedDevices: 1, affectedAccounts: 18 },
      evidence: ["pm_238", "203.xxx.xxx", "device_18"],
    },
    {
      key: "reviewRing",
      label: "Review ring concentration",
      confidence: 0.92,
      summary: "Review activity is concentrated around one seller and product.",
      metrics: { reviews: 73, windowMinutes: 12, averageRating: 5, uniqueReviewers: 18 },
      evidence: ["seller_23", "asin_B001"],
    },
    {
      key: "refundAbuse",
      label: "Refund abuse",
      confidence: 0.81,
      summary: "Refund frequency exceeded the expected threshold.",
      metrics: { refundRate: 0.62, refundCount: 12 },
      evidence: ["order_12", "order_18"],
    },
    {
      key: "temporalBurst",
      label: "Temporal burst",
      confidence: 0.87,
      summary: "Accounts, orders, and reviews occurred in short time windows.",
      metrics: { accountsCreated: 18, windowMinutes: 10, ordersSubmitted: 84 },
      evidence: ["09:00", "09:04", "09:07"],
    },
    {
      key: "denseCluster",
      label: "Dense relationship cluster",
      confidence: 0.89,
      summary: "Entity relationships formed unusually dense connections.",
      metrics: { density: 0.84, nodes: 43, edges: 109 },
      evidence: ["cluster_001"],
    },
  ],
  timeline: [
    { time: "09:00", event: "Seller account seller_23 was created." },
    { time: "09:04", event: "18 buyer accounts were created." },
    { time: "09:07", event: "84 orders were submitted." },
    { time: "09:12", event: "73 five-star reviews were posted." },
    { time: "09:20", event: "12 refund requests were detected." },
  ],
  graph: {
    nodes: [
      { id: "cluster_001", label: "cluster_001", type: "cluster", risk: 91 },
      { id: "seller_23", label: "seller_23", type: "seller", risk: 91 },
      { id: "asin_B001", label: "asin_B001", type: "product", risk: 84 },
      { id: "buyer_001", label: "buyer_001", type: "buyer", risk: 88 },
      { id: "buyer_002", label: "buyer_002", type: "buyer", risk: 86 },
      { id: "buyer_003", label: "buyer_003", type: "buyer", risk: 82 },
      { id: "pm_238", label: "pm_238", type: "payment", risk: 79 },
      { id: "ip_203", label: "203.xxx.xxx", type: "ip", risk: 76 },
      { id: "device_18", label: "device_18", type: "device", risk: 74 },
      { id: "orders_84", label: "84 orders", type: "order", risk: 80 },
      { id: "reviews_73", label: "73 reviews", type: "review", risk: 92 },
      { id: "refunds_12", label: "12 refunds", type: "refund", risk: 71 },
    ],
    edges: [
      { id: "e_cluster_seller", source: "cluster_001", target: "seller_23", label: "owns" },
      { id: "e_seller_product", source: "seller_23", target: "asin_B001", label: "lists" },
      { id: "e_b1_product", source: "buyer_001", target: "asin_B001", label: "orders" },
      { id: "e_b2_product", source: "buyer_002", target: "asin_B001", label: "orders" },
      { id: "e_b3_product", source: "buyer_003", target: "asin_B001", label: "orders" },
      { id: "e_b1_payment", source: "buyer_001", target: "pm_238", label: "uses" },
      { id: "e_b2_payment", source: "buyer_002", target: "pm_238", label: "uses" },
      { id: "e_b3_payment", source: "buyer_003", target: "pm_238", label: "uses" },
      { id: "e_b1_ip", source: "buyer_001", target: "ip_203", label: "logs in" },
      { id: "e_b2_ip", source: "buyer_002", target: "ip_203", label: "logs in" },
      { id: "e_b3_device", source: "buyer_003", target: "device_18", label: "shares" },
      { id: "e_orders_product", source: "orders_84", target: "asin_B001", label: "burst" },
      { id: "e_reviews_product", source: "reviews_73", target: "asin_B001", label: "5-star" },
      { id: "e_refunds_orders", source: "refunds_12", target: "orders_84", label: "refunds" },
    ],
  },
  case: {
    id: "case_cluster_001",
    status: "Escalated",
    owner: "Marketplace Trust",
    priority: "High",
    notes: [
      "Preserve buyer, seller, payment, device, and IP evidence before outreach.",
      "Hold seller payout while review integrity and refund abuse checks are completed.",
    ],
    updatedAt: "2026-06-27T09:20:00.000Z",
  },
  report: {
    id: "report_cluster_001",
    title: "Investigation Report: Fake Review Ring",
    verdict: "High-confidence coordinated manipulation centered on seller_23 and asin_B001.",
    generatedAt: "2026-06-27T09:21:00.000Z",
    sections: [
      {
        title: "Pattern Explainer",
        body: "The cluster combines shared resources, review concentration, temporal bursts, and refund anomalies.",
        bullets: [
          "18 buyer accounts converged on one seller and one product.",
          "73 five-star reviews appeared inside a 12-minute window.",
          "Shared payment, IP, and device signals connect the buyer cohort.",
        ],
      },
      {
        title: "Missing Evidence Checker",
        body: "The packet is strong enough for escalation, with two evidence gaps to close before enforcement.",
        bullets: [
          "Confirm fulfillment and delivery scans for the 84 submitted orders.",
          "Compare review text similarity and buyer account recovery attributes.",
        ],
      },
      {
        title: "False Positive Checker",
        body: "Legitimate promotional bursts are possible but unlikely given the resource sharing and refund rate.",
        bullets: [
          "No normal campaign should reuse the same payment, IP, and device resources this tightly.",
          "A 0.62 refund rate sharply exceeds a normal post-purchase review campaign profile.",
        ],
      },
    ],
    recommendations: [
      "Escalate case_cluster_001 for immediate fraud operations review.",
      "Temporarily suppress reviews tied to the 18-account cohort.",
      "Place payout hold on seller_23 pending manual investigation.",
      "Export graph and packet for investigator handoff.",
    ],
  },
};

export const dashboardRepository = {
  async getDashboardSummary() {
    try {
      const [buyers, sellers, orders, reviews, refunds, graphNodes, graphEdges] = await Promise.all([
        prisma.buyer.count({ where: { scenarioId: "review-ring" } }),
        prisma.seller.count({ where: { scenarioId: "review-ring" } }),
        prisma.order.count({ where: { scenarioId: "review-ring" } }),
        prisma.review.count({ where: { scenarioId: "review-ring" } }),
        prisma.refund.count({ where: { scenarioId: "review-ring" } }),
        prisma.graphNode.findMany({ where: { scenarioId: "review-ring" } }),
        prisma.graphEdge.findMany({ where: { scenarioId: "review-ring" } }),
      ]);

      if (graphNodes.length === 0) {
        return fallbackDashboard;
      }

      return {
        ...fallbackDashboard,
        summary: {
          ...fallbackDashboard.summary,
          buyers: buyers || fallbackDashboard.summary.buyers,
          sellers: sellers || fallbackDashboard.summary.sellers,
          orders: orders || fallbackDashboard.summary.orders,
          reviews: reviews || fallbackDashboard.summary.reviews,
          refunds: refunds || fallbackDashboard.summary.refunds,
        },
        graph: {
          nodes: graphNodes.map((node) => ({
            id: node.externalId,
            label: node.label,
            type: node.entityType as DashboardPacket["graph"]["nodes"][number]["type"],
            risk: node.externalId === "cluster_001" ? 91 : undefined,
          })),
          edges: graphEdges.map((edge) => ({
            id: edge.externalId,
            source: edge.sourceNodeId,
            target: edge.targetNodeId,
            label: edge.relationship,
          })),
        },
      };
    } catch {
      return fallbackDashboard;
    }
  },
  async createReport(caseId: string) {
    try {
      const report = await prisma.report.create({
        data: {
          caseId,
          scenarioId: "review-ring",
        },
      });

      return { reportId: report.id, caseId, report: fallbackDashboard.report };
    } catch {
      return { reportId: fallbackDashboard.report.id, caseId, report: fallbackDashboard.report };
    }
  },
  async updateCase(caseId: string, status?: string, notes?: string[]) {
    const nextCase = {
      ...fallbackDashboard.case,
      id: caseId || fallbackDashboard.case.id,
      status: status || fallbackDashboard.case.status,
      notes: notes ?? fallbackDashboard.case.notes,
      updatedAt: new Date().toISOString(),
    };

    try {
      await prisma.case.upsert({
        where: { externalId: nextCase.id },
        create: {
          externalId: nextCase.id,
          status: nextCase.status,
          scenarioId: "review-ring",
        },
        update: {
          status: nextCase.status,
        },
      });
    } catch {
      return nextCase;
    }

    return nextCase;
  },
};
