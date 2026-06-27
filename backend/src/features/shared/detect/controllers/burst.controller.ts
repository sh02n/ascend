import type { NormalizedDataset } from "../types/DatasetRecord.js";
import type {
  TemporalBurstContext,
  TemporalBurstEvent,
  TemporalBurstEventType,
} from "../types/TemporalBurstContext.js";
import { getDataset } from "../repositories/dataset.repository.js";

const TEMPORAL_BURST_SCORE = 15;

interface BurstRule {
  eventType: TemporalBurstEventType;
  threshold: number;
  windowMinutes: number;
}

interface TimestampedEvent {
  id: string;
  entityId: string;
  eventType: TemporalBurstEventType;
  timestamp: string;
  title: string;
  timestampMs: number;
}

interface BurstWindow {
  rule: BurstRule;
  events: TimestampedEvent[];
}

const BURST_RULES: BurstRule[] = [
  { eventType: "ACCOUNT_CREATED", threshold: 10, windowMinutes: 10 },
  { eventType: "ORDER_CREATED", threshold: 20, windowMinutes: 10 },
  { eventType: "REVIEW_CREATED", threshold: 15, windowMinutes: 15 },
];

function confidenceForEventCount(eventCount: number) {
  if (eventCount >= 40) {
    return 0.95;
  }

  if (eventCount >= 20) {
    return 0.8;
  }

  if (eventCount >= 10) {
    return 0.6;
  }

  return 0;
}

function toTimestampedEvent(
  entityId: string,
  eventType: TemporalBurstEventType,
  timestamp: string | null | undefined,
  title: string,
): TimestampedEvent | null {
  if (!timestamp) {
    return null;
  }

  const timestampMs = Date.parse(timestamp);

  if (Number.isNaN(timestampMs)) {
    return null;
  }

  return {
    id: `${eventType.toLowerCase()}-${entityId}`,
    entityId,
    eventType,
    timestamp: new Date(timestampMs).toISOString(),
    title,
    timestampMs,
  };
}

function findLargestBurstWindow(events: TimestampedEvent[], rule: BurstRule): BurstWindow {
  const sortedEvents = events
    .filter((event) => event.eventType === rule.eventType)
    .sort((left, right) => left.timestampMs - right.timestampMs);
  const windowMs = rule.windowMinutes * 60_000;
  let startIndex = 0;
  let bestWindow: TimestampedEvent[] = [];

  for (let endIndex = 0; endIndex < sortedEvents.length; endIndex += 1) {
    while (sortedEvents[endIndex].timestampMs - sortedEvents[startIndex].timestampMs > windowMs) {
      startIndex += 1;
    }

    const currentWindow = sortedEvents.slice(startIndex, endIndex + 1);

    if (currentWindow.length > bestWindow.length) {
      bestWindow = currentWindow;
    }
  }

  return {
    rule,
    events: bestWindow,
  };
}

function eventToTimelineEvent(event: TimestampedEvent): TemporalBurstEvent {
  return {
    id: event.id,
    entityId: event.entityId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    title: event.title,
  };
}

export function detectTemporalBurstFromDataset(dataset: NormalizedDataset): TemporalBurstContext {
  const events = [
    ...dataset.buyers
      .map((buyer) =>
        toTimestampedEvent(buyer.id, "ACCOUNT_CREATED", buyer.createdAt, "Account created"),
      )
      .filter((event): event is TimestampedEvent => Boolean(event)),
    ...dataset.orders
      .map((order) => toTimestampedEvent(order.id, "ORDER_CREATED", order.orderDate, "Order created"))
      .filter((event): event is TimestampedEvent => Boolean(event)),
    ...dataset.reviews
      .map((review) =>
        toTimestampedEvent(review.id, "REVIEW_CREATED", review.reviewDate, "Review submitted"),
      )
      .filter((event): event is TimestampedEvent => Boolean(event)),
  ];

  const burstWindows = BURST_RULES.map((rule) => findLargestBurstWindow(events, rule));
  const strongestBurst = burstWindows.reduce<BurstWindow | null>((currentBest, candidate) => {
    if (!currentBest || candidate.events.length > currentBest.events.length) {
      return candidate;
    }

    return currentBest;
  }, null);

  const eventCount = strongestBurst?.events.length ?? 0;
  const detected = Boolean(strongestBurst && eventCount >= strongestBurst.rule.threshold);
  const windowStart = strongestBurst?.events[0]?.timestamp ?? null;
  const windowEnd = strongestBurst?.events[strongestBurst.events.length - 1]?.timestamp ?? null;
  const evidence = [windowStart, windowEnd].filter((timestamp): timestamp is string => Boolean(timestamp));
  const eventCounts = {
    accountsCreated: burstWindows.find((burst) => burst.rule.eventType === "ACCOUNT_CREATED")?.events.length ?? 0,
    orders: burstWindows.find((burst) => burst.rule.eventType === "ORDER_CREATED")?.events.length ?? 0,
    reviews: burstWindows.find((burst) => burst.rule.eventType === "REVIEW_CREATED")?.events.length ?? 0,
  };

  return {
    detected,
    score: detected ? TEMPORAL_BURST_SCORE : 0,
    confidence: detected ? confidenceForEventCount(eventCount) : 0,
    summary: detected
      ? "Accounts, orders or reviews occurred in short activity windows"
      : "No temporal burst pattern found",
    metrics: {
      ...eventCounts,
      windowMinutes: strongestBurst?.rule.windowMinutes ?? null,
    },
    evidence: detected ? evidence : [],
    windowStart: detected ? windowStart : null,
    windowEnd: detected ? windowEnd : null,
    burstType: detected ? strongestBurst?.rule.eventType ?? null : null,
    events: detected ? (strongestBurst?.events ?? []).map(eventToTimelineEvent) : [],
  };
}

export async function detectTemporalBurst(
  dataset?: NormalizedDataset,
): Promise<TemporalBurstContext> {
  const detectionDataset = dataset ?? (await getDataset());

  return detectTemporalBurstFromDataset(detectionDataset);
}
