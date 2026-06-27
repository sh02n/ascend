import type { Express } from "express";
import { investigationSessionRouter } from "../core/session/session.routes.js";
import { authRouter } from "./shared/auth/routes/auth.routes.js";
import { requireAuth } from "./shared/auth/middleware/auth.middleware.js";
import { scenarioRouter } from "./shared/scenario/routes/scenario.routes.js";

export function registerFeatureRoutes(app: Express) {
  app.use("/api", authRouter);
  app.use("/api", requireAuth, investigationSessionRouter);
  app.use("/api", requireAuth, scenarioRouter);
}
