import { prisma } from "../../../db/prisma.js";

export const investigateRepository = {
  async createInvestigation(caseId: string) {
    // TODO: replace with Prisma investigation insert using seeded cluster and risk context.
    void prisma;
    return { investigationId: "todo-investigation-id", caseId };
  },
  async findInvestigationByCaseId(caseId: string) {
    // TODO: replace with Prisma investigation lookup after scenario seeding.
    void prisma;
    return { caseId };
  },
};
