interface GraphSeedInput {
  scenarioId: string;
  sourceFiles: string[];
}

export async function generateGraphEntities(input: GraphSeedInput) {
  // TODO: derive graph nodes and edges from the seeded relational records.
  return {
    scenarioId: input.scenarioId,
    filesProcessed: input.sourceFiles.length,
  };
}
