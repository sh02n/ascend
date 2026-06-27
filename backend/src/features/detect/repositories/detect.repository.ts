import { prisma } from "../../../db/prisma.js";

export const detectRepository = {
  async listClusters() {
    // TODO: replace with Prisma cluster query against seeded shared tables.
    void prisma;
    return [];
  },
  async findSignalById(signalId: string) {
    // TODO: replace with Prisma signal query against seeded shared tables.
    void prisma;
    return { id: signalId };
  },
  async findRiskById(riskId: string) {
    // TODO: replace with Prisma risk query against seeded shared tables.
    void prisma;
    return { id: riskId };
  },
};
