import { prisma } from "../../../../db/prisma.js";

export const scenarioRepository = {
  async findSessionById(sessionId: string) {
    // TODO: replace with Prisma query for session retrieval after scenario load.
    void prisma;
    return { sessionId };
  },
  async createScenarioSession(datasetName: string) {
    // TODO: replace with Prisma query for scenario session creation and seed tracking.
    void prisma;
    return { sessionId: "todo-session-id", datasetName };
  },
};
