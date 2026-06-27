export interface ConsumerProduct {
  url: string;
  marketplace: string;
  title: string | null;
  brand: string | null;
  seller: string | null;
  rating: number | null;
  reviewCount: number | null;
  price: number | null;
  currency: string | null;
  imageUrl: string | null;
}

export type ConsumerTrustLevel = "Suspicious" | "Mixed" | "Likely Genuine";

export interface ConsumerTrust {
  score: number;
  level: ConsumerTrustLevel;
}

export type ConsumerSignalStatus = "clear" | "watch" | "flagged";
export type ConsumerSignalId =
  | "sellerTrust"
  | "reviewAuthenticity"
  | "returnRisk"
  | "promotionManipulation"
  | "coordinatedActivity";

export interface ConsumerSignal {
  id: ConsumerSignalId;
  title: string;
  mappedFrom: "sharedResource" | "reviewRing" | "refundAbuse" | "temporalBurst" | "denseCluster";
  status: ConsumerSignalStatus;
  scoreImpact: number;
  confidence: number;
  summary: string;
  evidence: string[];
  details: string[];
}

export interface ConsumerInsight {
  id: string;
  title: string;
  summary: string;
  details: string[];
}

export interface ConsumerAlternative {
  title: string;
  reason: string;
}

export interface ConsumerAnalysis {
  analysisId: string;
  checkedAt: string;
  product: ConsumerProduct;
  trust: ConsumerTrust;
  verdict: string;
  signals: ConsumerSignal[];
  insights: ConsumerInsight[];
  alternatives: ConsumerAlternative[];
}

export interface RecentConsumerCheck {
  analysisId: string;
  checkedAt: string;
  productUrl: string;
  title: string;
  marketplace: string;
  trustScore: number;
  trustLevel: ConsumerTrustLevel;
  verdict: string;
}
