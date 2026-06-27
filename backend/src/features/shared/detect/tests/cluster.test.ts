import assert from "node:assert/strict";
import { test } from "node:test";
import { sortClustersByRisk } from "../controllers/cluster.controller.js";

test("clusters sort by highest risk first", () => {
  const sorted = sortClustersByRisk([
    { id: "low", score: 10, level: "LOW" },
    { id: "high", score: 91, level: "HIGH" },
    { id: "medium", score: 55, level: "MEDIUM" },
  ]);

  assert.deepEqual(
    sorted.map((cluster) => cluster.id),
    ["high", "medium", "low"],
  );
});
