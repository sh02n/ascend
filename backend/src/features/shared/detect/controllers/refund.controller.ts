import type { NormalizedDataset, Refund } from "../types/DatasetRecord.js";
import type { RefundAbuseContext } from "../types/RefundAbuseContext.js";
import { getDataset } from "../repositories/dataset.repository.js";

const REFUND_ABUSE_SCORE = 10;
const REFUND_RATE_THRESHOLD = 0.4;
const REFUND_FREQUENCY_WINDOW_MINUTES = 30;
const REPEAT_REFUND_THRESHOLD = 3;

function confidenceForRefundRate(refundRate: number, detected: boolean) {
  if (refundRate >= 0.8) {
    return 0.95;
  }

  if (refundRate >= 0.6) {
    return 0.81;
  }

  if (refundRate >= 0.4) {
    return 0.6;
  }

  return detected ? 0.6 : 0;
}

function minutesBetween(startTimestamp: number, endTimestamp: number) {
  return Math.round(((endTimestamp - startTimestamp) / 60_000) * 100) / 100;
}

function findTightestRefundWindow(refunds: Refund[]) {
  const timestamps = refunds
    .map((refund) => (refund.refundDate ? Date.parse(refund.refundDate) : Number.NaN))
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

export function detectRefundAbuseFromDataset(dataset: NormalizedDataset): RefundAbuseContext {
  const ordersById = new Map(dataset.orders.map((order) => [order.id, order]));
  const refundsByBuyer = new Map<string, Refund[]>();

  for (const refund of dataset.refunds) {
    if (!refund.orderId) {
      continue;
    }

    const order = ordersById.get(refund.orderId);

    if (!order?.buyerId) {
      continue;
    }

    const buyerRefunds = refundsByBuyer.get(order.buyerId) ?? [];
    buyerRefunds.push(refund);
    refundsByBuyer.set(order.buyerId, buyerRefunds);
  }

  const refundRate = dataset.orders.length > 0 ? dataset.refunds.length / dataset.orders.length : 0;
  const tightestWindowMinutes = findTightestRefundWindow(dataset.refunds);
  const repeatBuyerIds = [...refundsByBuyer.entries()]
    .filter(([, refunds]) => refunds.length >= REPEAT_REFUND_THRESHOLD)
    .map(([buyerId]) => buyerId)
    .sort();

  const refundRateDetected = refundRate >= REFUND_RATE_THRESHOLD;
  const refundFrequencyDetected =
    tightestWindowMinutes !== null && tightestWindowMinutes <= REFUND_FREQUENCY_WINDOW_MINUTES;
  const repeatRefundUsersDetected = repeatBuyerIds.length > 0;
  const detected = refundRateDetected || refundFrequencyDetected || repeatRefundUsersDetected;
  const refundedOrderIds = dataset.refunds
    .map((refund) => refund.orderId)
    .filter((orderId): orderId is string => Boolean(orderId))
    .sort();

  return {
    detected,
    score: detected ? REFUND_ABUSE_SCORE : 0,
    confidence: confidenceForRefundRate(refundRate, detected),
    summary: detected ? "Refund frequency exceeded threshold" : "No refund abuse pattern found",
    metrics: {
      refundRate: Math.round(refundRate * 100) / 100,
      refundCount: dataset.refunds.length,
      orders: dataset.orders.length,
      repeatRefundBuyers: repeatBuyerIds.length,
      windowMinutes: tightestWindowMinutes,
    },
    evidence: detected ? refundedOrderIds.slice(0, 10) : [],
    repeatBuyerIds,
    refundedOrderIds,
  };
}

export async function detectRefundAbuse(
  dataset?: NormalizedDataset,
): Promise<RefundAbuseContext> {
  const detectionDataset = dataset ?? (await getDataset());

  return detectRefundAbuseFromDataset(detectionDataset);
}
