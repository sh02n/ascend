import type { AiInvestigationReport } from "../types/index.js";

export const investigationReportMock: AiInvestigationReport = {
  reportId: "AMZ-INV-2026-0091",
  generatedAt: "2026-06-27T09:45:00Z",
  executiveSummary:
    "The cluster shows a high-confidence fake review ring pattern in Amazon review data. Eighteen reviewers submitted 73 reviews for one product in a 12-minute window, producing a 4.97 average rating with limited reviewer history and highly similar review language. The recommended disposition is to temporarily suppress suspicious reviews, delay publication, and escalate the product for trust and safety review.",
  evidence: [
    {
      id: "ev-1",
      label: "Review burst concentration",
      severity: "HIGH",
      detail: "18 reviewers submitted 73 reviews for the same ASIN within a 12-minute window.",
      source: "Amazon Reviews fields: reviewerID, asin, unixReviewTime",
    },
    {
      id: "ev-2",
      label: "Rating inflation",
      severity: "HIGH",
      detail:
        "The average rating across the clustered reviews is 4.97 stars, with nearly all reviews assigning the maximum score.",
      source: "Amazon Reviews field: overall",
    },
    {
      id: "ev-3",
      label: "Limited reviewer history",
      severity: "HIGH",
      detail:
        "Reviewer accounts have very limited review history outside the targeted product, suggesting purpose-built or coordinated accounts.",
      source: "Reviewer activity profile",
    },
    {
      id: "ev-4",
      label: "Review text similarity",
      severity: "HIGH",
      detail: "Multiple reviews use overlapping phrases, similar sentiment structure, and repeated product claims.",
      source: "Amazon Reviews field: reviewText",
    },
    {
      id: "ev-5",
      label: "Single-product interaction",
      severity: "MEDIUM",
      detail: "The reviewer accounts mostly interact with the same product instead of showing diverse organic review behavior.",
      source: "Reviewer-to-ASIN graph",
    },
  ],
  pattern: {
    title: "Coordinated Fake Review Ring",
    confidence: 92,
    description:
      "Accounts appear to coordinate review submissions to artificially increase product ranking and reputation.",
    indicators: [
      "Reviews cluster tightly around one ASIN and one short time window.",
      "Ratings are unusually positive compared with expected organic distribution.",
      "Reviewer histories are sparse and concentrated on the same product.",
      "Review text contains repeated phrasing and near-identical claims.",
    ],
  },
  falsePositives: [
    {
      id: "fp-1",
      consideration: "Legitimate promotional campaign",
      assessment:
        "A promotion could produce a short-term review increase, but it would need to explain the limited reviewer histories and high text similarity.",
      likelihood: "MEDIUM",
    },
    {
      id: "fp-2",
      consideration: "Product launched through influencer marketing",
      assessment:
        "Influencer-driven traffic can concentrate attention on one product, but organic campaigns usually show more varied review language and rating spread.",
      likelihood: "MEDIUM",
    },
    {
      id: "fp-3",
      consideration: "Seasonal sales event causing genuine review spikes",
      assessment:
        "A seasonal event could increase review volume, though the 12-minute window and near-perfect average rating remain unusual.",
      likelihood: "MEDIUM",
    },
  ],
  missingEvidence: [
    {
      id: "me-1",
      evidence: "Purchase verification",
      reason: "Verified purchase status would help distinguish real customers from reviews submitted without receiving the product.",
      priority: "HIGH",
    },
    {
      id: "me-2",
      evidence: "Shipping confirmation",
      reason: "Shipment and delivery confirmation would support whether reviewers actually received the product.",
      priority: "HIGH",
    },
    {
      id: "me-3",
      evidence: "Longer review history",
      reason: "More historical activity would clarify whether each reviewer behaves normally across categories and products.",
      priority: "MEDIUM",
    },
    {
      id: "me-4",
      evidence: "Reviewer device metadata",
      reason: "Device metadata would help identify whether supposedly independent reviewers share technical fingerprints.",
      priority: "MEDIUM",
    },
  ],
  recommendation: {
    action: "Suppress suspicious reviews and escalate product review",
    priority: "HIGH",
    rationale:
      "The review timing, rating distribution, reviewer concentration, and text similarity create a coherent manipulation pattern. Suppressing suspicious reviews protects product ranking integrity while additional evidence is reviewed.",
    nextSteps: [
      "Temporarily suppress the suspicious reviews from public ranking calculations.",
      "Flag the ASIN for trust and safety review.",
      "Delay publication of related pending reviews until verification is complete.",
      "Escalate the cluster to the marketplace integrity team.",
    ],
  },
  timeline: [
    {
      id: "tl-1",
      timestamp: "09:00",
      title: "Product listed",
      description: "The ASIN enters the monitored review stream with limited initial engagement.",
      riskImpact: "MEDIUM",
    },
    {
      id: "tl-2",
      timestamp: "09:10",
      title: "Reviewer accounts become active",
      description: "Reviewer accounts with sparse prior history begin interacting with the same product.",
      riskImpact: "HIGH",
    },
    {
      id: "tl-3",
      timestamp: "09:15",
      title: "Orders placed",
      description: "Order activity associated with the reviewer cluster appears shortly before review submissions.",
      riskImpact: "MEDIUM",
    },
    {
      id: "tl-4",
      timestamp: "09:28",
      title: "73 reviews submitted",
      description: "The product receives 73 reviews from 18 reviewers inside a compressed 12-minute window.",
      riskImpact: "HIGH",
    },
    {
      id: "tl-5",
      timestamp: "09:40",
      title: "Product ranking increases rapidly",
      description: "The product ranking rises quickly after the near-perfect review burst.",
      riskImpact: "HIGH",
    },
  ],
  suggestedQuestions: [
    {
      id: "why-review-ring-suspicious",
      question: "Why is this review ring suspicious?",
      answer:
        "The strongest indicators are the unusually concentrated review timing, limited reviewer history, high review similarity, and almost exclusive interaction with a single product.",
    },
    {
      id: "evidence-contributed-most",
      question: "Which evidence contributed most?",
      answer:
        "The review burst contributed most because 73 reviews from 18 reviewers appeared within 12 minutes for one ASIN. The 4.97 average rating and similar review text strengthen that signal.",
    },
    {
      id: "legitimate-promotion",
      question: "Could this be a legitimate promotion?",
      answer:
        "It could be, especially if there was a documented campaign or influencer launch. The risk remains high because legitimate promotions usually produce more varied timing, ratings, and review language.",
    },
    {
      id: "evidence-still-missing",
      question: "What evidence is still missing?",
      answer:
        "The main gaps are verified purchase status, shipping confirmation, longer reviewer histories, and reviewer device metadata. These would help separate genuine customers from coordinated review accounts.",
    },
    {
      id: "why-suppress-reviews",
      question: "Why recommend suppressing reviews?",
      answer:
        "Suppressing reviews limits ranking manipulation while the trust and safety team verifies whether the reviews came from real, independent customers. It is a reversible containment step.",
    },
    {
      id: "lower-risk-score",
      question: "What would lower the risk score?",
      answer:
        "The score would fall if the reviews were verified purchases, shipment records confirmed delivery, reviewer histories showed normal diverse activity, and text similarity dropped after deduplication.",
    },
  ],
};
