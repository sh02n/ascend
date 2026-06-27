import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateRisk } from "../controllers/risk.controller.js";
import type { DenseClusterContext } from "../types/DenseClusterContext.js";
import type { RefundAbuseContext } from "../types/RefundAbuseContext.js";
import type { ReviewRingContext } from "../types/ReviewRingContext.js";
import type { SharedResourceContext } from "../types/SharedResourceContext.js";
import type { TemporalBurstContext } from "../types/TemporalBurstContext.js";

function sharedResource(detected: boolean, confidence: number): SharedResourceContext {
  return {
    detected,
    score: detected ? 25 : 0,
    confidence,
    summary: "shared",
    metrics: { sharedPayments: 0, sharedIPs: 0, sharedDevices: 0, affectedAccounts: 0 },
    evidence: detected ? ["shared"] : [],
    sharedPaymentMethods: [],
    sharedIPAddresses: [],
    sharedDevices: [],
  };
}

function reviewRing(detected: boolean, confidence: number): ReviewRingContext {
  return {
    detected,
    score: detected ? 20 : 0,
    confidence,
    summary: "review",
    metrics: { reviews: 0, windowMinutes: null, affectedBuyers: 0, sellerConcentration: 0 },
    evidence: detected ? ["seller"] : [],
    sellerId: detected ? "seller" : null,
    concentratedBuyerIds: [],
    concentratedReviewIds: [],
  };
}

function refundAbuse(detected: boolean, confidence: number): RefundAbuseContext {
  return {
    detected,
    score: detected ? 10 : 0,
    confidence,
    summary: "refund",
    metrics: { refundRate: 0, refundCount: 0, orders: 0, repeatRefundBuyers: 0, windowMinutes: null },
    evidence: detected ? ["order"] : [],
    repeatBuyerIds: [],
    refundedOrderIds: [],
  };
}

function temporalBurst(detected: boolean, confidence: number): TemporalBurstContext {
  return {
    detected,
    score: detected ? 15 : 0,
    confidence,
    summary: "burst",
    metrics: { accountsCreated: 0, orders: 0, reviews: 0, windowMinutes: null },
    evidence: detected ? ["time"] : [],
    windowStart: null,
    windowEnd: null,
    burstType: null,
    events: [],
  };
}

function denseCluster(detected: boolean, confidence: number): DenseClusterContext {
  return {
    detected,
    score: detected ? 21 : 0,
    confidence,
    summary: "dense",
    metrics: { density: 0, nodes: 0, edges: 0, largestComponent: 0 },
    evidence: detected ? ["cluster"] : [],
    largestComponentNodeIds: [],
  };
}

test("risk engine maps low, medium and high", () => {
  assert.equal(
    calculateRisk({
      sharedResource: sharedResource(true, 1),
      reviewRing: reviewRing(false, 0),
      refundAbuse: refundAbuse(false, 0),
      temporalBurst: temporalBurst(false, 0),
      denseCluster: denseCluster(false, 0),
    }).level,
    "LOW",
  );
  assert.equal(
    calculateRisk({
      sharedResource: sharedResource(true, 1),
      reviewRing: reviewRing(true, 1),
      refundAbuse: refundAbuse(true, 1),
      temporalBurst: temporalBurst(false, 0),
      denseCluster: denseCluster(false, 0),
    }).level,
    "MEDIUM",
  );
  assert.equal(
    calculateRisk({
      sharedResource: sharedResource(true, 1),
      reviewRing: reviewRing(true, 1),
      refundAbuse: refundAbuse(true, 1),
      temporalBurst: temporalBurst(true, 1),
      denseCluster: denseCluster(true, 1),
    }).level,
    "HIGH",
  );
});
