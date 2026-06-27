import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { graphController } from "../controllers/graph.controller.js";

export const graphRouter = Router();

graphRouter.post("/graph/build", asyncHandler(graphController.buildGraph));
