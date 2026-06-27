import { Router } from "express";
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { scenarioController } from "../controllers/scenario.controller.js";

export const scenarioRouter = Router();

scenarioRouter.post("/scenario/load", asyncHandler(scenarioController.loadScenario));
scenarioRouter.get("/session", asyncHandler(scenarioController.getSession));
