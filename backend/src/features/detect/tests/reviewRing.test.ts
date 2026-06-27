import assert from "node:assert/strict";
import { test } from "node:test";
import { detectReviewRingFromDataset } from "../controllers/reviewRing.controller.js";
import { createEmptyDataset } from "./testFactory.js";

test("review ring detects concentrated seller reviews", () => {
  const dataset = createEmptyDataset();
  dataset.reviews = Array.from({ length: 10 }, (_, index) => ({
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

  const result = detectReviewRingFromDataset(dataset);

  assert.equal(result.detected, true);
  assert.deepEqual(result.evidence, ["seller_1"]);
});

test("review ring is clear for empty datasets", () => {
  assert.equal(detectReviewRingFromDataset(createEmptyDataset()).detected, false);
});
