export interface LoadScenarioRequest {
  datasetName: string;
}

export interface ScenarioSession {
  sessionId: string;
  scenarioName?: string;
  graphReady?: boolean;
}
