import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { registerFeatureRoutes } from "./features/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

function createAllowedOrigins() {
  const configuredOrigin = env.CLIENT_ORIGIN;
  const alternateOrigin = configuredOrigin.includes("localhost")
    ? configuredOrigin.replace("localhost", "127.0.0.1")
    : configuredOrigin.includes("127.0.0.1")
      ? configuredOrigin.replace("127.0.0.1", "localhost")
      : configuredOrigin;

  return new Set([configuredOrigin, alternateOrigin]);
}

export function createApp() {
  const app = express();
  const allowedOrigins = createAllowedOrigins();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS"));
      },
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
