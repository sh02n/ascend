import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { investigationController } from "../controllers/investigation.controller.js";
import { recommendationController } from "../controllers/recommendation.controller.js";

export const investigateRouter = Router();

investigateRouter.post("/investigate", asyncHandler(investigationController.investigate));
investigateRouter.post("/explain", asyncHandler(recommendationController.explain));
