import { Router } from "express";
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { getRisk } from "../controllers/risk.controller.js";

export const detectRiskRouter = Router();

detectRiskRouter.get("/risk/:clusterId", asyncHandler(getRisk));
