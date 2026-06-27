import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { getConsumerAnalysis } from "../controllers/analysis.controller.js";
import { verifyConsumerProduct } from "../controllers/verify.controller.js";

export const consumerRouter = Router();

consumerRouter.post("/consumer/verify", asyncHandler(verifyConsumerProduct));
consumerRouter.get("/consumer/analysis/:id", asyncHandler(getConsumerAnalysis));
