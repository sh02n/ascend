import express, { type Request, type Response } from "express";
import { investigationSessionService } from "./session.service.js";

function requireUserId(req: Request) {
  if (!req.authUser?.id) {
    throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  }

  return req.authUser.id;
}

function filenameFromRequest(req: Request) {
  const encoded = req.header("x-import-filename");

  if (!encoded) {
    return "dataset.csv";
  }

  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function csvContentFromRequest(req: Request) {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }

  if (typeof req.body?.content === "string") {
    return req.body.content;
  }

  return "";
}

function routeId(req: Request) {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export const investigationSessionRouter = express.Router();

investigationSessionRouter.post(
  "/session/import",
  express.raw({ type: ["text/csv", "application/octet-stream"], limit: "25mb" }),
  async (req: Request, res: Response, next) => {
    try {
      const session = await investigationSessionService.importCsv({
        userId: requireUserId(req),
        filename: filenameFromRequest(req),
        content: csvContentFromRequest(req),
      });

      res.status(201).json({
        sessionId: session.id,
        status: session.status,
        importedDatasetId: session.importedDatasetId,
      });
    } catch (error) {
      next(error);
    }
  },
);

investigationSessionRouter.post("/session/verify", async (req: Request, res: Response, next) => {
  try {
    const productUrl = typeof req.body?.productUrl === "string" ? req.body.productUrl.trim() : "";

    if (!productUrl) {
      res.status(400).json({ message: "productUrl is required" });
      return;
    }

    const session = await investigationSessionService.verifyProduct({
      userId: requireUserId(req),
      productUrl,
    });

    res.status(201).json({
      sessionId: session.id,
      analysisId: session.id,
      status: session.status,
    });
  } catch (error) {
    next(error);
  }
});

investigationSessionRouter.get("/session/:id", async (req: Request, res: Response, next) => {
  try {
    res.json(await investigationSessionService.analysis(routeId(req), requireUserId(req)));
  } catch (error) {
    next(error);
  }
});

investigationSessionRouter.get("/session/:id/analysis", async (req: Request, res: Response, next) => {
  try {
    res.json(await investigationSessionService.analysis(routeId(req), requireUserId(req)));
  } catch (error) {
    next(error);
  }
});

investigationSessionRouter.post("/session/:id/detect", async (req: Request, res: Response, next) => {
  try {
    res.json(await investigationSessionService.detect(routeId(req), requireUserId(req)));
  } catch (error) {
    next(error);
  }
});

investigationSessionRouter.post("/session/:id/investigate", async (req: Request, res: Response, next) => {
  try {
    res.json(await investigationSessionService.investigate(routeId(req), requireUserId(req)));
  } catch (error) {
    next(error);
  }
});

investigationSessionRouter.get("/session/:id/dashboard", async (req: Request, res: Response, next) => {
  try {
    res.json(await investigationSessionService.dashboard(routeId(req), requireUserId(req)));
  } catch (error) {
    next(error);
  }
});
