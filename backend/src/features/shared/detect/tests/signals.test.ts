import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSignalAggregation } from "../controllers/signals.controller.js";
import { createEmptyDataset } from "./testFactory.js";

test("signal aggregation keeps the public contract stable for empty data", async () => {
  const response = await buildSignalAggregation("cluster_001", createEmptyDataset());

  assert.deepEqual(Object.keys(response), [
    "cluster",
    "summary",
    "detections",
    "reasoningContext",
    "timeline",
  ]);
  assert.equal(response.cluster.risk.level, "LOW");
  assert.equal(response.timeline.length, 0);
});
