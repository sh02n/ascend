import type {
  Buyer,
  GraphData,
  GraphEdge,
  GraphNode,
  IPAddress,
  NormalizedDataset,
  Order,
  PaymentMethod,
  Refund,
  Review,
  Seller,
  Device,
} from "../types/DatasetRecord.js";

const baseTimestamp = Date.parse("2026-06-20T10:00:00.000Z");

function atMinute(minute: number) {
  return new Date(baseTimestamp + minute * 60_000).toISOString();
}

const buyers: Buyer[] = Array.from({ length: 10 }, (_, index) => ({
  id: `buyer_demo_${index + 1}`,
  externalId: `buyer_demo_${index + 1}`,
  displayName: [
    "Ava Cross",
    "Liam Vale",
    "Nora Flint",
    "Milo Hart",
    "Iris Lane",
    "Theo Marsh",
    "Zoe Calder",
    "Noah Pierce",
    "Elle Rowan",
    "Kai Mercer",
  ][index],
  profileLink: `/users/demo-${index + 1}`,
  countryCode: "US",
  reviewCount: 4 + index,
  createdAt: atMinute(index),
  sourceRowNumbers: [index + 2],
}));

const sellers: Seller[] = [
  {
    id: "seller_demo_1",
    externalId: "seller_demo_1",
    displayName: "Northwind Outlet",
    marketplace: "amazon",
    createdAt: atMinute(-120),
  },
  {
    id: "seller_demo_2",
    externalId: "seller_demo_2",
    displayName: "Harbor Lane Market",
    marketplace: "amazon",
    createdAt: atMinute(-260),
  },
];

const orders: Order[] = [
  ...buyers.map((buyer, index) => ({
    id: `order_demo_${index + 1}`,
    externalId: `order_demo_${index + 1}`,
    buyerId: buyer.id,
    sellerId: "seller_demo_1",
    status: index < 5 ? "refunded" : "completed",
    orderDate: atMinute(index),
  })),
  {
    id: "order_demo_11",
    externalId: "order_demo_11",
    buyerId: buyers[0].id,
    sellerId: "seller_demo_2",
    status: "completed",
    orderDate: atMinute(180),
  },
  {
    id: "order_demo_12",
    externalId: "order_demo_12",
    buyerId: buyers[1].id,
    sellerId: "seller_demo_2",
    status: "completed",
    orderDate: atMinute(220),
  },
];

const reviews: Review[] = [
  ...buyers.map((buyer, index) => ({
    id: `review_demo_${index + 1}`,
    externalId: `review_demo_${index + 1}`,
    buyerId: buyer.id,
    sellerId: "seller_demo_1",
    ratingValue: 5,
    title: `Five-star review ${index + 1}`,
    body: "Fast shipping and exactly as described.",
    reviewDate: atMinute(index + 1),
    experienceDate: atMinute(index + 1).slice(0, 10),
    countryCode: "US",
  })),
  {
    id: "review_demo_11",
    externalId: "review_demo_11",
    buyerId: buyers[0].id,
    sellerId: "seller_demo_2",
    ratingValue: 4,
    title: "Steady seller option",
    body: "Solid purchase experience.",
    reviewDate: atMinute(200),
    experienceDate: atMinute(200).slice(0, 10),
    countryCode: "US",
  },
  {
    id: "review_demo_12",
    externalId: "review_demo_12",
    buyerId: buyers[1].id,
    sellerId: "seller_demo_2",
    ratingValue: 5,
    title: "Reliable alternative",
    body: "Would buy again.",
    reviewDate: atMinute(240),
    experienceDate: atMinute(240).slice(0, 10),
    countryCode: "US",
  },
];

const refunds: Refund[] = Array.from({ length: 5 }, (_, index) => ({
  id: `refund_demo_${index + 1}`,
  externalId: `refund_demo_${index + 1}`,
  orderId: `order_demo_${index + 1}`,
  amount: 39 + index,
  reason: index % 2 === 0 ? "item not received" : "damaged item",
  refundDate: atMinute(20 + index),
}));

const paymentMethods: PaymentMethod[] = buyers.map((buyer, index) => ({
  id: `payment_demo_${index + 1}`,
  externalId: `payment_demo_${index + 1}`,
  buyerId: buyer.id,
  provider: "visa",
  last4: "4242",
}));

const devices: Device[] = buyers.map((buyer, index) => ({
  id: `device_demo_${index + 1}`,
  externalId: `device_demo_${index + 1}`,
  buyerId: buyer.id,
  fingerprint: "device-group-1",
}));

const ipAddresses: IPAddress[] = buyers.map((buyer, index) => ({
  id: `ip_demo_${index + 1}`,
  externalId: `ip_demo_${index + 1}`,
  buyerId: buyer.id,
  ipAddress: "203.0.113.10",
}));

const denseNodeIds = [
  buyers[0].id,
  buyers[1].id,
  buyers[2].id,
  buyers[3].id,
  sellers[0].id,
  orders[0].id,
  reviews[0].id,
  paymentMethods[0].id,
];

const denseNodes: GraphNode[] = [
  { id: buyers[0].id, externalId: buyers[0].externalId, entityType: "BUYER", label: buyers[0].displayName },
  { id: buyers[1].id, externalId: buyers[1].externalId, entityType: "BUYER", label: buyers[1].displayName },
  { id: buyers[2].id, externalId: buyers[2].externalId, entityType: "BUYER", label: buyers[2].displayName },
  { id: buyers[3].id, externalId: buyers[3].externalId, entityType: "BUYER", label: buyers[3].displayName },
  { id: sellers[0].id, externalId: sellers[0].externalId, entityType: "SELLER", label: sellers[0].displayName },
  { id: orders[0].id, externalId: orders[0].externalId, entityType: "ORDER", label: orders[0].id },
  { id: reviews[0].id, externalId: reviews[0].externalId, entityType: "REVIEW", label: reviews[0].title ?? reviews[0].id },
  { id: paymentMethods[0].id, externalId: paymentMethods[0].externalId, entityType: "PAYMENT_METHOD", label: "4242" },
];

const denseEdges: GraphEdge[] = denseNodeIds.flatMap((sourceNodeId) =>
  denseNodeIds
    .filter((targetNodeId) => targetNodeId !== sourceNodeId)
    .map((targetNodeId) => ({
      id: `edge_${sourceNodeId}_${targetNodeId}`,
      externalId: `edge_${sourceNodeId}_${targetNodeId}`,
      sourceNodeId,
      targetNodeId,
      relationship: "CONNECTED",
    })),
);

const graph: GraphData = {
  nodes: denseNodes,
  edges: denseEdges,
};

export const demoNormalizedDataset: NormalizedDataset = {
  buyers,
  sellers,
  orders,
  reviews,
  refunds,
  paymentMethods,
  devices,
  ipAddresses,
  graph,
};
