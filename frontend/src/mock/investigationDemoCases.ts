import type { InvestigationCluster, RiskLevel } from "../types/investigation";

export interface InvestigationDemoCase {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  investigationInput: InvestigationCluster & {
    detections?: Array<{
      id: string;
      label: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      description: string;
      evidence: string[];
    }>;
    reasoningContext?: string[];
    timeline?: Array<{
      time: string;
      title: string;
      description: string;
    }>;
  };
}

export const investigationDemoCases: InvestigationDemoCase[] = [
  {
    id: "AMZ-REV-9142",
    name: "Amazon Fake Review Ring",
    riskLevel: "HIGH",
    investigationInput: {
      clusterId: "AMZ-REV-9142",
      title: "Fake Review Ring",
      riskLevel: "HIGH",
      riskScore: 91,
      scenario: "Fake Review Ring",
      entitiesReviewed: 18,
      productCount: 1,
      reviewCount: 73,
      averageRating: 4.97,
      reviewBurstWindow: "12 minutes",
      primarySignals: [
        "18 reviewers targeted the same ASIN",
        "73 reviews submitted in a 12-minute burst",
        "Average rating inflated to 4.97 stars",
        "Repeated reviewers show limited history outside this product",
      ],
      entities: [
        {
          id: "asin_B07FAKE9142",
          type: "product",
          label: "ASIN B07FAKE9142",
          riskSignals: ["73 clustered reviews", "Average rating 4.97"],
        },
        {
          id: "reviewer_cluster_18",
          type: "reviewer",
          label: "Reviewer cluster of 18 accounts",
          riskSignals: ["Limited review history", "Same product focus"],
        },
        {
          id: "review_burst_73",
          type: "review",
          label: "73 product reviews",
          riskSignals: ["12-minute burst", "High text similarity"],
        },
      ],
      detections: [
        {
          id: "reviewRing",
          label: "Review ring",
          severity: "HIGH",
          description: "18 reviewers repeatedly focused on the same ASIN.",
          evidence: ["reviewer_cluster_18", "asin_B07FAKE9142", "review_burst_73"],
        },
        {
          id: "temporalBurst",
          label: "Temporal burst",
          severity: "HIGH",
          description: "73 reviews arrived inside a 12-minute window.",
          evidence: ["unixReviewTime_09:28", "review_burst_73"],
        },
        {
          id: "textSimilarity",
          label: "Text similarity",
          severity: "HIGH",
          description: "Review text shows repeated claims and highly similar phrasing.",
          evidence: ["reviewText_similarity_0.88", "phrase_cluster_04"],
        },
      ],
      reasoningContext: [
        "Amazon Reviews dataset fields available: reviewerID, asin, overall, reviewText, unixReviewTime.",
        "No payout, banking, or payment metadata is present for this scenario.",
      ],
      timeline: [
        { time: "09:00", title: "Product listed", description: "ASIN enters the monitored review stream." },
        { time: "09:28", title: "73 reviews submitted", description: "Reviews cluster in a 12-minute window." },
      ],
    },
  },
  {
    id: "REF-ABUSE-2207",
    name: "Refund Abuse Cluster",
    riskLevel: "HIGH",
    investigationInput: {
      clusterId: "REF-ABUSE-2207",
      title: "Refund Abuse Cluster",
      riskLevel: "HIGH",
      riskScore: 84,
      scenario: "Refund Abuse",
      entitiesReviewed: 12,
      productCount: 3,
      reviewCount: 46,
      averageRating: 0,
      reviewBurstWindow: "Refund burst after delivery",
      primarySignals: [
        "28 refunds across 46 orders",
        "12 buyers repeatedly interact with 3 sellers",
        "Shared delivery address variants",
        "Refund requests cluster after delivery",
      ],
      entities: [
        { id: "buyer_group_12", type: "reviewer", label: "12 buyers", riskSignals: ["High refund rate"] },
        { id: "seller_group_3", type: "product", label: "3 sellers", riskSignals: ["Repeated counterparties"] },
        { id: "refund_28", type: "review", label: "28 refunds", riskSignals: ["61% refund rate"] },
      ],
      detections: [
        {
          id: "refundAbuse",
          label: "Refund abuse",
          severity: "HIGH",
          description: "28 refunds across 46 orders creates a 61% refund rate.",
          evidence: ["refund_28", "order_46", "refund_rate_0.61"],
        },
      ],
      reasoningContext: ["Refund activity is measured against orders and delivery timing."],
      timeline: [
        { time: "Day 1", title: "Orders placed", description: "46 orders placed by 12 buyers." },
        { time: "Day 4", title: "Refund spike", description: "28 refund requests submitted." },
      ],
    },
  },
  {
    id: "COL-SELLER-4410",
    name: "Seller-Buyer Collusion",
    riskLevel: "HIGH",
    investigationInput: {
      clusterId: "COL-SELLER-4410",
      title: "Seller-Buyer Collusion",
      riskLevel: "HIGH",
      riskScore: 87,
      scenario: "Seller-Buyer Collusion",
      entitiesReviewed: 15,
      productCount: 2,
      reviewCount: 41,
      averageRating: 4.82,
      reviewBurstWindow: "3 days",
      primarySignals: [
        "15 buyers repeatedly interact with 2 sellers",
        "Shared payment method, IP, and device evidence",
        "41 reviews cluster around the seller group",
        "$128,450 exposure",
      ],
      entities: [
        { id: "seller_group_2", type: "product", label: "2 sellers", riskSignals: ["Payout similarity"] },
        { id: "buyer_group_15", type: "reviewer", label: "15 buyers", riskSignals: ["Repeated seller focus"] },
        { id: "device_18", type: "device", label: "Device 18", riskSignals: ["Shared across accounts"] },
        { id: "ip_203", type: "ip", label: "203.xxx.xxx", riskSignals: ["Shared resource"] },
      ],
      detections: [
        {
          id: "sharedResource",
          label: "Shared resource",
          severity: "HIGH",
          description: "Buyer and seller accounts share operational resources.",
          evidence: ["pm_238", "203.xxx.xxx", "device_18"],
        },
      ],
      reasoningContext: ["Synthetic marketplace metadata includes shared resource and payout similarity signals."],
      timeline: [
        { time: "Week 1", title: "Order activity begins", description: "15 buyers place orders with 2 sellers." },
        { time: "Week 3", title: "Shared resources detected", description: "Payment method, IP, and device overlaps appear." },
      ],
    },
  },
  {
    id: "SAFE-ORD-1029",
    name: "Normal / Low-Risk Cluster",
    riskLevel: "LOW",
    investigationInput: {
      clusterId: "SAFE-ORD-1029",
      title: "Normal Marketplace Activity",
      riskLevel: "LOW",
      riskScore: 24,
      scenario: "Normal Marketplace Activity",
      entitiesReviewed: 32,
      productCount: 12,
      reviewCount: 21,
      averageRating: 4.21,
      reviewBurstWindow: "No burst detected",
      primarySignals: [
        "No dense suspicious cluster",
        "No burst detected",
        "No strong shared resources",
        "Refund volume within expected range",
      ],
      entities: [
        { id: "buyer_group_32", type: "reviewer", label: "32 buyers", riskSignals: ["Distributed behavior"] },
        { id: "seller_group_12", type: "product", label: "12 sellers", riskSignals: ["No concentration"] },
        { id: "review_group_21", type: "review", label: "21 reviews", riskSignals: ["Normal timing"] },
      ],
      detections: [
        {
          id: "mostlyNormalActivity",
          label: "Mostly normal activity",
          severity: "LOW",
          description: "Orders, reviews, and refunds are distributed across many participants.",
          evidence: ["buyer_group_32", "seller_group_12", "order_64"],
        },
      ],
      reasoningContext: ["Low-risk case is included as a control scenario for investigation testing."],
      timeline: [
        { time: "Week 1", title: "Normal ordering", description: "Orders distributed across sellers." },
        { time: "Week 3", title: "Low refund count", description: "3 refunds observed across 64 orders." },
      ],
    },
  },
];

export const getInvestigationDemoCaseById = (id: string) =>
  investigationDemoCases.find((demoCase) => demoCase.id === id) ?? getDefaultInvestigationDemoCase();

export const getDefaultInvestigationDemoCase = () => investigationDemoCases[0];
