import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { clusterController } from "../controllers/cluster.controller.js";
import { signalController } from "../controllers/signal.controller.js";

export const detectClusterRouter = Router();

detectClusterRouter.get("/clusters", asyncHandler(clusterController.getClusters));
detectClusterRouter.get("/signals/:id", asyncHandler(signalController.getSignal));
