export interface ClusterSummary {
  id: string;
  label: string;
}

export interface SignalDetail {
  id: string;
  label: string;
  severity?: string;
}

export interface RiskSummary {
  id: string;
  score: number;
}
