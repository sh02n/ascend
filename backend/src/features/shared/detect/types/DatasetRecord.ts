export interface DatasetRecord {
  rowNumber: number;
  sourceRecordId: string;
  reviewerName: string | null;
  profileLink: string | null;
  countryCode: string | null;
  reviewCount: number | null;
  reviewDate: string | null;
  ratingValue: number | null;
  reviewTitle: string | null;
  reviewText: string | null;
  experienceDate: string | null;
}

export interface Buyer {
  id: string;
  externalId: string;
  displayName: string;
  profileLink: string | null;
  countryCode: string | null;
  reviewCount: number | null;
  createdAt?: string | null;
  sourceRowNumbers: number[];
}

export interface Seller {
  id: string;
  externalId: string;
  displayName: string;
  marketplace: string | null;
  createdAt?: string | null;
}

export interface Order {
  id: string;
  externalId: string;
  buyerId: string | null;
  sellerId: string | null;
  status: string | null;
  orderDate: string | null;
}

export interface Review {
  id: string;
  externalId: string;
  buyerId: string | null;
  sellerId: string | null;
  ratingValue: number | null;
  title: string | null;
  body: string | null;
  reviewDate: string | null;
  experienceDate: string | null;
  countryCode: string | null;
}

export interface Refund {
  id: string;
  externalId: string;
  orderId: string | null;
  amount: number | null;
  reason: string | null;
  refundDate: string | null;
}

export interface PaymentMethod {
  id: string;
  externalId: string;
  buyerId: string | null;
  provider: string | null;
  last4: string | null;
}

export interface Device {
  id: string;
  externalId: string;
  buyerId: string | null;
  fingerprint: string | null;
}

export interface IPAddress {
  id: string;
  externalId: string;
  buyerId: string | null;
  ipAddress: string | null;
}

export type GraphNodeType =
  | "BUYER"
  | "SELLER"
  | "ORDER"
  | "REVIEW"
  | "REFUND"
  | "PAYMENT_METHOD"
  | "DEVICE"
  | "IP_ADDRESS";

export interface GraphNode {
  id: string;
  externalId: string;
  entityType: GraphNodeType;
  label: string;
}

export interface GraphEdge {
  id: string;
  externalId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationship: string;
}

export interface ClusterData {
  clusterId: string;
  memberBuyerIds: string[];
  memberReviewIds: string[];
  source: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface NormalizedDataset {
  buyers: Buyer[];
  sellers: Seller[];
  orders: Order[];
  reviews: Review[];
  refunds: Refund[];
  paymentMethods: PaymentMethod[];
  devices: Device[];
  ipAddresses: IPAddress[];
  graph: GraphData;
}

export const exampleNormalizedDataset: NormalizedDataset = {
  buyers: [
    {
      id: "buyer-example",
      externalId: "buyer-example",
      displayName: "Example Reviewer",
      profileLink: "/users/example",
      countryCode: "US",
      reviewCount: 12,
      sourceRowNumbers: [2],
    },
  ],
  sellers: [],
  orders: [],
  reviews: [
    {
      id: "review-example",
      externalId: "review-example",
      buyerId: "buyer-example",
      sellerId: null,
      ratingValue: 1,
      title: "Example low-rating review",
      body: "Example review body",
      reviewDate: "2024-09-16T13:44:26.000Z",
      experienceDate: "2024-09-16",
      countryCode: "US",
    },
  ],
  refunds: [],
  paymentMethods: [],
  devices: [],
  ipAddresses: [],
  graph: {
    nodes: [
      {
        id: "buyer-example",
        externalId: "buyer-example",
        entityType: "BUYER",
        label: "Example Reviewer",
      },
      {
        id: "review-example",
        externalId: "review-example",
        entityType: "REVIEW",
        label: "Example low-rating review",
      },
    ],
    edges: [
      {
        id: "edge-example",
        externalId: "edge-example",
        sourceNodeId: "buyer-example",
        targetNodeId: "review-example",
        relationship: "AUTHORED",
      },
    ],
  },
};
