import assert from "node:assert/strict";
import { test } from "node:test";
import { detectRefundAbuseFromDataset } from "../controllers/refund.controller.js";
import { createEmptyDataset } from "./testFactory.js";

test("refund abuse detects high refund ratio", () => {
  const dataset = createEmptyDataset();
  dataset.orders = Array.from({ length: 5 }, (_, index) => ({
    id: `order_${index}`,
    externalId: `order_${index}`,
    buyerId: "buyer_1",
    sellerId: "seller_1",
    status: index < 3 ? "refunded" : "completed",
    orderDate: "2024-02-01T10:00:00.000Z",
  }));
  dataset.refunds = dataset.orders.slice(0, 3).map((order, index) => ({
    id: `refund_${index}`,
    externalId: `refund_${index}`,
    orderId: order.id,
    amount: 20,
    reason: "not received",
    refundDate: new Date(Date.UTC(2024, 1, 1, 11, index * 10)).toISOString(),
  }));

  const result = detectRefundAbuseFromDataset(dataset);

  assert.equal(result.detected, true);
  assert.equal(result.metrics.refundCount, 3);
});

test("refund abuse is clear for empty datasets", () => {
  assert.equal(detectRefundAbuseFromDataset(createEmptyDataset()).detected, false);
});
