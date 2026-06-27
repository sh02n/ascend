import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import type { InvestigationSessionMode, InvestigationSessionStatus } from "./session.types.js";

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const investigationSessionRepository = {
  create(input: {
    userId: string;
    mode: InvestigationSessionMode;
    status: InvestigationSessionStatus;
    sourceType: string;
    sourceRef?: string;
    importedDatasetId?: string;
    productUrl?: string;
    graph?: unknown;
    signals?: unknown;
    investigation?: unknown;
    dashboard?: unknown;
  }) {
    return prisma.investigationSession.create({
      data: {
        userId: input.userId,
        mode: input.mode,
        status: input.status,
        sourceType: input.sourceType,
        sourceRef: input.sourceRef,
        importedDatasetId: input.importedDatasetId,
        productUrl: input.productUrl,
        graph: input.graph === undefined ? undefined : json(input.graph),
        signals: input.signals === undefined ? undefined : json(input.signals),
        investigation: input.investigation === undefined ? undefined : json(input.investigation),
        dashboard: input.dashboard === undefined ? undefined : json(input.dashboard),
      },
    });
  },

  findForUser(sessionId: string, userId: string) {
    return prisma.investigationSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
  },

  updateForUser(
    sessionId: string,
    userId: string,
    input: Partial<{
      status: InvestigationSessionStatus;
      sourceRef: string;
      importedDatasetId: string;
      productUrl: string;
      graph: unknown;
      signals: unknown;
      investigation: unknown;
      dashboard: unknown;
    }>,
  ) {
    return prisma.investigationSession.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data: {
        status: input.status,
        sourceRef: input.sourceRef,
        importedDatasetId: input.importedDatasetId,
        productUrl: input.productUrl,
        graph: input.graph === undefined ? undefined : json(input.graph),
        signals: input.signals === undefined ? undefined : json(input.signals),
        investigation: input.investigation === undefined ? undefined : json(input.investigation),
        dashboard: input.dashboard === undefined ? undefined : json(input.dashboard),
      },
    });
  },
};
