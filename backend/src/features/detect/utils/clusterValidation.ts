export const DEFAULT_CLUSTER_ID = "cluster_001";

export function validateClusterId(clusterId: string | undefined) {
  if (!clusterId?.trim()) {
    return {
      valid: false,
      status: 400,
      message: "Invalid cluster id",
    };
  }

  if (clusterId !== DEFAULT_CLUSTER_ID) {
    return {
      valid: false,
      status: 404,
      message: "Cluster not found",
    };
  }

  return {
    valid: true,
    status: 200,
    message: "OK",
  };
}
