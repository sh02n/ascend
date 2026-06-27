import type { NormalizedDataset } from "../types/DatasetRecord.js";
import type { SharedResourceContext, SharedResourceGroup } from "../types/SharedResourceContext.js";
import { getDataset } from "../repositories/dataset.repository.js";

const SHARED_RESOURCE_SCORE = 25;

interface GroupableResource {
  resourceId: string | null;
  accountId: string | null;
}

function groupSharedResources(resources: GroupableResource[]): SharedResourceGroup[] {
  const accountsByResource = new Map<string, Set<string>>();

  for (const resource of resources) {
    if (!resource.resourceId || !resource.accountId) {
      continue;
    }

    const accounts = accountsByResource.get(resource.resourceId) ?? new Set<string>();
    accounts.add(resource.accountId);
    accountsByResource.set(resource.resourceId, accounts);
  }

  return [...accountsByResource.entries()]
    .map(([resourceId, accounts]) => ({
      resourceId,
      accountIds: [...accounts].sort(),
      accountCount: accounts.size,
    }))
    .filter((group) => group.accountCount > 1)
    .sort((left, right) => right.accountCount - left.accountCount);
}

function confidenceForAccountCount(accountCount: number) {
  if (accountCount >= 15) {
    return 0.95;
  }

  if (accountCount >= 9) {
    return 0.85;
  }

  if (accountCount >= 4) {
    return 0.6;
  }

  if (accountCount > 1) {
    return 0.3;
  }

  return 0;
}

export function detectSharedResourcesFromDataset(dataset: NormalizedDataset): SharedResourceContext {
  const sharedPaymentMethods = groupSharedResources(
    dataset.paymentMethods.map((paymentMethod) => ({
      resourceId:
        paymentMethod.provider && paymentMethod.last4
          ? `${paymentMethod.provider}:${paymentMethod.last4}`
          : paymentMethod.externalId,
      accountId: paymentMethod.buyerId,
    })),
  );

  const sharedIPAddresses = groupSharedResources(
    dataset.ipAddresses.map((ipAddress) => ({
      resourceId: ipAddress.ipAddress,
      accountId: ipAddress.buyerId,
    })),
  );

  const sharedDevices = groupSharedResources(
    dataset.devices.map((device) => ({
      resourceId: device.fingerprint ?? device.externalId,
      accountId: device.buyerId,
    })),
  );

  const affectedAccounts = new Set<string>();
  const flaggedGroups = [...sharedPaymentMethods, ...sharedIPAddresses, ...sharedDevices];

  for (const group of flaggedGroups) {
    for (const accountId of group.accountIds) {
      affectedAccounts.add(accountId);
    }
  }

  const maxLinkedAccounts = flaggedGroups.reduce(
    (currentMax, group) => Math.max(currentMax, group.accountCount),
    0,
  );
  const detected = flaggedGroups.length > 0;
  const evidence = flaggedGroups.map((group) => group.resourceId);

  return {
    detected,
    score: detected ? SHARED_RESOURCE_SCORE : 0,
    confidence: confidenceForAccountCount(maxLinkedAccounts),
    summary: detected
      ? "Multiple accounts share payment methods, devices or IPs"
      : "No shared payment methods, devices or IPs found",
    metrics: {
      sharedPayments: sharedPaymentMethods.length,
      sharedIPs: sharedIPAddresses.length,
      sharedDevices: sharedDevices.length,
      affectedAccounts: affectedAccounts.size,
    },
    evidence,
    sharedPaymentMethods,
    sharedIPAddresses,
    sharedDevices,
  };
}

export async function detectSharedResources(
  dataset?: NormalizedDataset,
): Promise<SharedResourceContext> {
  const detectionDataset = dataset ?? (await getDataset());

  return detectSharedResourcesFromDataset(detectionDataset);
}
