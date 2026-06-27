CREATE TABLE "investigation_sessions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceRef" TEXT,
  "importedDatasetId" TEXT,
  "productUrl" TEXT,
  "graph" JSONB,
  "signals" JSONB,
  "investigation" JSONB,
  "dashboard" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "investigation_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "investigation_sessions_userId_idx" ON "investigation_sessions"("userId");
CREATE INDEX "investigation_sessions_mode_idx" ON "investigation_sessions"("mode");
