import express, { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { importController } from "../controllers/import.controller.js";

export const importRouter = Router();

importRouter.post("/import/session", asyncHandler(importController.createSession));
importRouter.post(
  "/import/upload",
  express.raw({ limit: "25mb", type: "application/octet-stream" }),
  asyncHandler(importController.uploadDataset),
);
importRouter.post("/import/profile", asyncHandler(importController.profileDataset));
importRouter.post("/import/validate", asyncHandler(importController.validateDataset));
importRouter.post("/import/analyse", asyncHandler(importController.analyseDataset));
importRouter.post("/import/map", asyncHandler(importController.mapDataset));
importRouter.post("/import/transform", asyncHandler(importController.transformDataset));
importRouter.get("/import/status/:sessionId", asyncHandler(importController.getImportStatus));
