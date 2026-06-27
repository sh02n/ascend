import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { getSignals } from "../controllers/signals.controller.js";

export const detectSignalsRouter = Router();

detectSignalsRouter.get("/signals/:clusterId", asyncHandler(getSignals));
