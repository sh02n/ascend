import type { Express } from "express";
import { scenarioRouter } from "./scenario/routes/scenario.routes.js";
import { graphRouter } from "./scenario/routes/graph.routes.js";
import { detectClusterRouter } from "./detect/routes/cluster.routes.js";
import { detectRiskRouter } from "./detect/routes/risk.routes.js";
import { investigateRouter } from "./investigate/routes/investigation.routes.js";
import { dashboardRouter } from "./dashboard/routes/dashboard.routes.js";
import { reportRouter } from "./dashboard/routes/report.routes.js";

export function registerFeatureRoutes(app: Express) {
  app.use("/api", scenarioRouter);
  app.use("/api", graphRouter);
  app.use("/api", detectClusterRouter);
  app.use("/api", detectRiskRouter);
  app.use("/api", investigateRouter);
  app.use("/api", dashboardRouter);
  app.use("/api", reportRouter);
}
