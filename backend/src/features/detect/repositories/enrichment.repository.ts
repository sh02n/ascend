import type {
  Buyer,
  Device,
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
} from "../types/DatasetRecord.js";

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function stableNumber(seed: string, modulo: number) {
  return hashString(seed) % modulo;
}

function stableId(prefix: string, seed: string) {
  return `${prefix}_${hashString(seed).toString(36)}`;
}

function countryBucket(countryCode: string | null) {
  return (countryCode ?? "XX").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) || "XX";
}

function addMinutes(timestamp: string | null, minutes: number) {
  const sourceTimestamp = timestamp ? Date.parse(timestamp) : Number.NaN;
  const baseTimestamp = Number.isNaN(sourceTimestamp)
    ? Date.UTC(2024, 0, 1, 0, 0, 0)
    : sourceTimestamp;

  return new Date(baseTimestamp + minutes * 60_000).toISOString();
}

function earliestReviewDateForBuyer(buyer: Buyer, reviewsByBuyerId: Map<string, Review[]>) {
  const buyerReviews = reviewsByBuyerId.get(buyer.id) ?? [];
  const earliestTimestamp = buyerReviews.reduce<number | null>((currentEarliest, review) => {
    if (!review.reviewDate) {
      return currentEarliest;
    }

    const timestamp = Date.parse(review.reviewDate);

    if (Number.isNaN(timestamp)) {
      return currentEarliest;
    }

    return currentEarliest === null || timestamp < currentEarliest ? timestamp : currentEarliest;
  }, null);

  return earliestTimestamp === null
    ? null
    : new Date(earliestTimestamp - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function buildReviewsByBuyer(reviews: Review[]) {
  const reviewsByBuyerId = new Map<string, Review[]>();

  for (const review of reviews) {
    if (!review.buyerId) {
      continue;
    }

    const buyerReviews = reviewsByBuyerId.get(review.buyerId) ?? [];
    buyerReviews.push(review);
    reviewsByBuyerId.set(review.buyerId, buyerReviews);
  }

  return reviewsByBuyerId;
}

function buildSellers(buyers: Buyer[]) {
  const sellersById = new Map<string, Seller>();

  for (const buyer of buyers) {
    const region = countryBucket(buyer.countryCode);
    const sellerGroup = stableNumber(`${buyer.id}:${region}`, 24);
    const sellerId = `seller_${region.toLowerCase()}_${sellerGroup}`;

    if (!sellersById.has(sellerId)) {
      sellersById.set(sellerId, {
        id: sellerId,
        externalId: sellerId,
        displayName: `Marketplace Seller ${region}-${sellerGroup}`,
        marketplace: "amazon",
        createdAt: addMinutes(null, sellerGroup * 13),
      });
    }
  }

  return [...sellersById.values()];
}

function sellerIdForBuyer(buyer: Buyer) {
  const region = countryBucket(buyer.countryCode);
  const sellerGroup = stableNumber(`${buyer.id}:${region}`, 24);
  return `seller_${region.toLowerCase()}_${sellerGroup}`;
}

function paymentForBuyer(buyer: Buyer): PaymentMethod {
  const region = countryBucket(buyer.countryCode);
  const sharedGroup = stableNumber(`${region}:${buyer.id}`, 18);
  const last4 = String(1000 + sharedGroup).padStart(4, "0");

  return {
    id: stableId("pm", `${region}:${sharedGroup}`),
    externalId: stableId("pm", `${region}:${sharedGroup}`),
    buyerId: buyer.id,
    provider: sharedGroup % 2 === 0 ? "visa" : "mastercard",
    last4,
  };
}

function deviceForBuyer(buyer: Buyer): Device {
  const region = countryBucket(buyer.countryCode);
  const deviceGroup = stableNumber(`${region}:${buyer.id}`, 12);
  const fingerprint = `device_${region.toLowerCase()}_${deviceGroup}`;

  return {
    id: stableId("device", `${region}:${deviceGroup}:${buyer.id}`),
    externalId: stableId("device", `${region}:${deviceGroup}:${buyer.id}`),
    buyerId: buyer.id,
    fingerprint,
  };
}

function ipForBuyer(buyer: Buyer): IPAddress {
  const region = countryBucket(buyer.countryCode);
  const regionSeed = stableNumber(region, 80);
  const ipGroup = stableNumber(`${region}:${buyer.id}`, 30);
  const ipAddress = `203.0.${regionSeed}.${10 + ipGroup}`;

  return {
    id: stableId("ip", `${region}:${ipGroup}:${buyer.id}`),
    externalId: stableId("ip", `${region}:${ipGroup}:${buyer.id}`),
    buyerId: buyer.id,
    ipAddress,
  };
}

function orderForReview(review: Review, buyer: Buyer): Order {
  const sellerId = sellerIdForBuyer(buyer);
  const orderDate = addMinutes(review.reviewDate, -stableNumber(review.id, 180));
  const orderId = stableId("order", `${buyer.id}:${review.reviewDate ?? review.id}`);

  return {
    id: orderId,
    externalId: orderId,
    buyerId: buyer.id,
    sellerId,
    status: review.ratingValue !== null && review.ratingValue <= 2 ? "refunded" : "completed",
    orderDate,
  };
}

function refundForOrder(order: Order, review: Review): Refund | null {
  if (review.ratingValue === null || review.ratingValue > 2) {
    return null;
  }

  const refundCluster = stableNumber(`${review.countryCode ?? "XX"}:${review.title ?? ""}`, 5);

  if (refundCluster > 2) {
    return null;
  }

  const refundId = stableId("refund", `${order.id}:${review.id}`);

  return {
    id: refundId,
    externalId: refundId,
    orderId: order.id,
    amount: null,
    reason: review.ratingValue === 1 ? "low_rating_dispute" : "negative_experience",
    refundDate: addMinutes(order.orderDate, 20 + stableNumber(review.id, 20)),
  };
}

function graphNode(id: string, entityType: GraphNode["entityType"], label: string): GraphNode {
  return {
    id,
    externalId: id,
    entityType,
    label,
  };
}

function graphEdge(sourceNodeId: string, targetNodeId: string, relationship: string): GraphEdge {
  const id = stableId("edge", `${sourceNodeId}:${relationship}:${targetNodeId}`);

  return {
    id,
    externalId: id,
    sourceNodeId,
    targetNodeId,
    relationship,
  };
}

function createGraph(dataset: Omit<NormalizedDataset, "graph">): GraphData {
  const nodesById = new Map<string, GraphNode>();
  const edgesById = new Map<string, GraphEdge>();

  const addNode = (node: GraphNode) => nodesById.set(node.id, node);
  const addEdge = (edge: GraphEdge) => edgesById.set(edge.id, edge);

  for (const buyer of dataset.buyers) {
    addNode(graphNode(buyer.id, "BUYER", buyer.displayName));
  }

  for (const seller of dataset.sellers) {
    addNode(graphNode(seller.id, "SELLER", seller.displayName));
  }

  for (const paymentMethod of dataset.paymentMethods) {
    addNode(graphNode(paymentMethod.id, "PAYMENT_METHOD", paymentMethod.last4 ?? paymentMethod.id));

    if (paymentMethod.buyerId) {
      addEdge(graphEdge(paymentMethod.buyerId, paymentMethod.id, "USES_PAYMENT"));
    }
  }

  for (const device of dataset.devices) {
    addNode(graphNode(device.id, "DEVICE", device.fingerprint ?? device.id));

    if (device.buyerId) {
      addEdge(graphEdge(device.buyerId, device.id, "USES_DEVICE"));
    }
  }

  for (const ipAddress of dataset.ipAddresses) {
    addNode(graphNode(ipAddress.id, "IP_ADDRESS", ipAddress.ipAddress ?? ipAddress.id));

    if (ipAddress.buyerId) {
      addEdge(graphEdge(ipAddress.buyerId, ipAddress.id, "USES_IP"));
    }
  }

  for (const review of dataset.reviews) {
    addNode(graphNode(review.id, "REVIEW", review.title ?? review.id));

    if (review.buyerId) {
      addEdge(graphEdge(review.buyerId, review.id, "AUTHORED_REVIEW"));
    }

    if (review.sellerId) {
      addEdge(graphEdge(review.id, review.sellerId, "REVIEWS_SELLER"));
    }
  }

  for (const order of dataset.orders) {
    addNode(graphNode(order.id, "ORDER", order.id));

    if (order.buyerId) {
      addEdge(graphEdge(order.buyerId, order.id, "PLACED_ORDER"));
    }

    if (order.sellerId) {
      addEdge(graphEdge(order.id, order.sellerId, "ORDERED_FROM"));
    }
  }

  for (const refund of dataset.refunds) {
    addNode(graphNode(refund.id, "REFUND", refund.reason ?? refund.id));

    if (refund.orderId) {
      addEdge(graphEdge(refund.orderId, refund.id, "HAS_REFUND"));
    }
  }

  return {
    nodes: [...nodesById.values()],
    edges: [...edgesById.values()],
  };
}

export function enrichDataset(dataset: NormalizedDataset): NormalizedDataset {
  const reviewsByBuyerId = buildReviewsByBuyer(dataset.reviews);
  const buyers = dataset.buyers.map((buyer) => ({
    ...buyer,
    createdAt: buyer.createdAt ?? earliestReviewDateForBuyer(buyer, reviewsByBuyerId),
  }));
  const buyersById = new Map(buyers.map((buyer) => [buyer.id, buyer]));
  const sellers = buildSellers(buyers);
  const orders: Order[] = [];
  const refunds: Refund[] = [];
  const reviews = dataset.reviews.map((review) => {
    const buyer = review.buyerId ? buyersById.get(review.buyerId) : undefined;

    if (!buyer) {
      return review;
    }

    const sellerId = sellerIdForBuyer(buyer);
    const order = orderForReview(review, buyer);
    const refund = refundForOrder(order, review);

    orders.push(order);

    if (refund) {
      refunds.push(refund);
    }

    return {
      ...review,
      sellerId,
    };
  });
  const paymentMethods = buyers.map(paymentForBuyer);
  const devices = buyers.map(deviceForBuyer);
  const ipAddresses = buyers.map(ipForBuyer);
  const enrichedDataset = {
    buyers,
    sellers,
    orders,
    reviews,
    refunds,
    paymentMethods,
    devices,
    ipAddresses,
  };

  return {
    ...enrichedDataset,
    graph: createGraph(enrichedDataset),
  };
}
