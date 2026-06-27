import type { ConsumerAnalysis, RecentConsumerCheck } from "../types";

const LAST_ANALYSIS_KEY = "ascend.consumer.lastAnalysis";
const RECENT_CHECKS_KEY = "ascend.consumer.recentChecks";
const MAX_RECENT_CHECKS = 6;

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getStoredLastAnalysis() {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(LAST_ANALYSIS_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as ConsumerAnalysis;
  } catch {
    return null;
  }
}

export function getStoredRecentChecks() {
  if (!canUseStorage()) {
    return [] as RecentConsumerCheck[];
  }

  const rawValue = window.localStorage.getItem(RECENT_CHECKS_KEY);

  if (!rawValue) {
    return [] as RecentConsumerCheck[];
  }

  try {
    return JSON.parse(rawValue) as RecentConsumerCheck[];
  } catch {
    return [];
  }
}

export function storeConsumerAnalysis(analysis: ConsumerAnalysis) {
  if (!canUseStorage()) {
    return;
  }

  const recentCheck: RecentConsumerCheck = {
    analysisId: analysis.analysisId,
    checkedAt: analysis.checkedAt,
    productUrl: analysis.product.url,
    title: analysis.product.title ?? "Untitled product",
    marketplace: analysis.product.marketplace,
    trustScore: analysis.trust.score,
    trustLevel: analysis.trust.level,
    verdict: analysis.verdict,
  };

  const updatedChecks = [
    recentCheck,
    ...getStoredRecentChecks().filter((item) => item.analysisId !== analysis.analysisId),
  ].slice(0, MAX_RECENT_CHECKS);

  window.localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(analysis));
  window.localStorage.setItem(RECENT_CHECKS_KEY, JSON.stringify(updatedChecks));
}
