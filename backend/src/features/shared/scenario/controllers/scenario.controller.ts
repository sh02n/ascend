import type { Request, Response } from "express";
import { scenarioRepository } from "../repositories/scenario.repository.js";

export const scenarioController = {
  async loadScenario(req: Request, res: Response) {
    const { datasetName } = req.body;

    // TODO: validate scenario id, trigger shared dataset import, and create session.
    const session = await scenarioRepository.createScenarioSession(datasetName);

    res.status(202).json({
      message: "Scenario load placeholder",
      data: session,
    });
  },
  async getSession(_req: Request, res: Response) {
    // TODO: read current seeded session from request or app context.
    const session = await scenarioRepository.findSessionById("todo-session-id");

    res.status(200).json({
      message: "Session placeholder",
      data: session,
    });
  },
};
