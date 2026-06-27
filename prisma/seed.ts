import { loadScenarioDefinition } from "../scenarios/loadScenario.js";
import { seedScenario } from "./seeds/importScenario.js";

async function main() {
  const scenarioId = process.argv[2] ?? "review-ring";
  const scenario = await loadScenarioDefinition(scenarioId);

  // TODO: replace placeholder flow with actual inserts and graph generation.
  await seedScenario(scenario);

  console.log(`Seed placeholder completed for scenario: ${scenario.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
