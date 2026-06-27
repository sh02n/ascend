import type { DetectionResult, SharedResourceMetrics } from "./DetectionResult.js";

export interface SharedResourceGroup {
  resourceId: string;
  accountIds: string[];
  accountCount: number;
}

export interface SharedResourceContext extends DetectionResult<SharedResourceMetrics> {
  sharedPaymentMethods: SharedResourceGroup[];
  sharedIPAddresses: SharedResourceGroup[];
  sharedDevices: SharedResourceGroup[];
}
