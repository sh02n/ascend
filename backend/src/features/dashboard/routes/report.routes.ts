import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { reportController } from "../controllers/report.controller.js";

export const reportRouter = Router();

reportRouter.post("/report", asyncHandler(reportController.createReport));
