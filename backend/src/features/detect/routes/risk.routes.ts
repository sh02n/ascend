import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { riskController } from "../controllers/risk.controller.js";

export const detectRiskRouter = Router();

detectRiskRouter.get("/risk/:id", asyncHandler(riskController.getRisk));
