import { prisma } from "../../../../db/prisma.js";

export const dashboardRepository = {
  async getDashboardSummary() {
    // TODO: replace with Prisma dashboard aggregation over seeded graph and case tables.
    void prisma;
    return { openCases: 0, graphNodes: 0 };
  },
  async createReport(caseId: string) {
    // TODO: replace with Prisma report insert using seeded investigation outputs.
    void prisma;
    return { reportId: "todo-report-id", caseId };
  },
  async updateCase(caseId: string, status?: string) {
    // TODO: replace with Prisma case update against shared case table.
    void prisma;
    return { caseId, status };
  },
};
