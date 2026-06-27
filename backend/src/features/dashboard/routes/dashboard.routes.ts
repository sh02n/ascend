import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { caseController } from "../controllers/case.controller.js";
import { dashboardController } from "../controllers/dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/dashboard", asyncHandler(dashboardController.getDashboard));
dashboardRouter.patch("/case", asyncHandler(caseController.updateCase));
