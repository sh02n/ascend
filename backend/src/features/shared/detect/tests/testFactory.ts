import type { NormalizedDataset } from "../types/DatasetRecord.js";

export function createEmptyDataset(): NormalizedDataset {
  return {
    buyers: [],
    sellers: [],
    orders: [],
    reviews: [],
    refunds: [],
    paymentMethods: [],
    devices: [],
    ipAddresses: [],
    graph: {
      nodes: [],
      edges: [],
    },
  };
}
