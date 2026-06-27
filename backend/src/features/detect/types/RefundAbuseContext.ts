import type { DetectionResult } from "./DetectionResult.js";

export interface RefundAbuseMetrics {
  refundRate: number;
  refundCount: number;
  orders: number;
  repeatRefundBuyers: number;
  windowMinutes: number | null;
}

export interface RefundAbuseContext extends DetectionResult<RefundAbuseMetrics> {
  repeatBuyerIds: string[];
  refundedOrderIds: string[];
}
