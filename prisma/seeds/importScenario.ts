import fs from "node:fs/promises";
import path from "node:path";
import type { ScenarioDefinition } from "../../scenarios/types.js";
import { prisma } from "../../backend/src/db/prisma.js";
import { generateGraphEntities } from "./graphSeed.js";

export async function seedScenario(scenario: ScenarioDefinition) {
  // TODO: replace with actual Prisma writes for buyers, sellers, orders, and related tables.
  const datasetFiles = await fs.readdir(scenario.datasetPath);
  const absoluteFiles = datasetFiles.map((fileName) => path.join(scenario.datasetPath, fileName));

  await generateGraphEntities({
    scenarioId: scenario.id,
    sourceFiles: absoluteFiles,
  });

  void prisma;
}
