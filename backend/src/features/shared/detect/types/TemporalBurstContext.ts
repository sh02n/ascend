import type { DetectionResult } from "./DetectionResult.js";

export type TemporalBurstEventType = "ACCOUNT_CREATED" | "ORDER_CREATED" | "REVIEW_CREATED";

export interface TemporalBurstMetrics {
  accountsCreated: number;
  orders: number;
  reviews: number;
  windowMinutes: number | null;
}

export interface TemporalBurstEvent {
  id: string;
  entityId: string;
  eventType: TemporalBurstEventType;
  timestamp: string;
  title: string;
}

export interface TemporalBurstContext extends DetectionResult<TemporalBurstMetrics> {
  windowStart: string | null;
  windowEnd: string | null;
  burstType: TemporalBurstEventType | null;
  events: TemporalBurstEvent[];
}
