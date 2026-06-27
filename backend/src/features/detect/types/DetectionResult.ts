export interface SharedResourceMetrics {
  sharedPayments: number;
  sharedIPs: number;
  sharedDevices: number;
  affectedAccounts: number;
}

export interface DetectionResult<TMetrics extends object = Record<string, number>> {
  detected: boolean;
  score: number;
  confidence: number;
  summary: string;
  metrics: TMetrics;
  evidence: string[];
}
