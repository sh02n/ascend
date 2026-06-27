export interface DashboardSummary {
  openCases: number;
  graphNodes: number;
}

export interface CaseSummary {
  id: string;
  status: string;
}

export interface ReportPayload {
  caseId: string;
}
