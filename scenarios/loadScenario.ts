import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  refundAbuseScenario,
  reviewRingScenario,
  sellerCollusionScenario,
} from "./index.js";
import type { ScenarioDefinition } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scenarioRegistry: Record<string, ScenarioDefinition> = {
  [reviewRingScenario.id]: reviewRingScenario,
  [refundAbuseScenario.id]: refundAbuseScenario,
  [sellerCollusionScenario.id]: sellerCollusionScenario,
};

export async function loadScenarioDefinition(scenarioId: string) {
  const scenario = scenarioRegistry[scenarioId];

  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  return {
    ...scenario,
    datasetPath: path.resolve(__dirname, "..", scenario.datasetPath.slice(1)),
  };
}
