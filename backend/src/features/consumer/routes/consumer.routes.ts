import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { getConsumerAnalysis } from "../controllers/analysis.controller.js";
import { compareConsumerListingsController } from "../controllers/compare.controller.js";
import { scanConsumerUrlController } from "../controllers/scanUrl.controller.js";
import { verifyConsumerProduct } from "../controllers/verify.controller.js";

export const consumerRouter = Router();

consumerRouter.post("/consumer/verify", asyncHandler(verifyConsumerProduct));
consumerRouter.get("/consumer/analysis/:id", asyncHandler(getConsumerAnalysis));
consumerRouter.post("/consumer/scan-url", asyncHandler(scanConsumerUrlController));
consumerRouter.post("/consumer/compare", asyncHandler(compareConsumerListingsController));
