import assert from "node:assert/strict";
import { test } from "node:test";
import { detectSharedResourcesFromDataset } from "../controllers/sharedResource.controller.js";
import { createEmptyDataset } from "./testFactory.js";

test("shared resource detects reused payment methods", () => {
  const dataset = createEmptyDataset();
  dataset.paymentMethods = [
    { id: "pm_1", externalId: "pm_1", buyerId: "buyer_1", provider: "visa", last4: "4242" },
    { id: "pm_2", externalId: "pm_2", buyerId: "buyer_2", provider: "visa", last4: "4242" },
  ];

  const result = detectSharedResourcesFromDataset(dataset);

  assert.equal(result.detected, true);
  assert.deepEqual(result.evidence, ["visa:4242"]);
});

test("shared resource is clear for empty datasets", () => {
  const result = detectSharedResourcesFromDataset(createEmptyDataset());

  assert.equal(result.detected, false);
  assert.equal(result.confidence, 0);
});
