import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { registerFeatureRoutes } from "./features/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  registerFeatureRoutes(app);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
