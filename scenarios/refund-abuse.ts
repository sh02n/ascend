import type { ScenarioDefinition } from "./types.js";

export const refundAbuseScenario: ScenarioDefinition = {
  id: "refund-abuse",
  name: "Refund Abuse",
  description: "Repeat refund behavior across payments, orders, and buyer accounts.",
  datasetPath: "/datasets/refund-abuse",
};
