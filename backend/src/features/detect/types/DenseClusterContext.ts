import type { DetectionResult } from "./DetectionResult.js";

export interface DenseClusterMetrics {
  density: number;
  nodes: number;
  edges: number;
  largestComponent: number;
}

export interface DenseClusterContext extends DetectionResult<DenseClusterMetrics> {
  largestComponentNodeIds: string[];
}
