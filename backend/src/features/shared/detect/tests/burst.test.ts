import assert from "node:assert/strict";
import { test } from "node:test";
import { detectTemporalBurstFromDataset } from "../controllers/burst.controller.js";
import { createEmptyDataset } from "./testFactory.js";

test("temporal burst detects review bursts", () => {
  const dataset = createEmptyDataset();
  dataset.reviews = Array.from({ length: 15 }, (_, index) => ({
    id: `review_${index}`,
    externalId: `review_${index}`,
    buyerId: `buyer_${index}`,
    sellerId: "seller_1",
    ratingValue: 5,
    title: "Great",
    body: "Fast",
    reviewDate: new Date(Date.UTC(2024, 1, 1, 10, index)).toISOString(),
    experienceDate: "2024-02-01",
    countryCode: "US",
  }));

  const result = detectTemporalBurstFromDataset(dataset);

  assert.equal(result.detected, true);
  assert.equal(result.events.length, 15);
});

test("temporal burst is clear for empty datasets", () => {
  assert.equal(detectTemporalBurstFromDataset(createEmptyDataset()).detected, false);
});
