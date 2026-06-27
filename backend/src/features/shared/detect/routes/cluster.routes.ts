import { Router } from "express";
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { getClusters } from "../controllers/cluster.controller.js";

export const detectClusterRouter = Router();

detectClusterRouter.get("/clusters", asyncHandler(getClusters));
