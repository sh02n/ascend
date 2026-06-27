export interface UpdateCaseBody {
  caseId: string;
  status?: string;
  notes?: string[];
}

export interface RiskBreakdown {
  sharedResource: number;
  reviewRing: number;
  refundAbuse: number;
  temporalBurst: number;
  denseCluster: number;
}

export interface DashboardGraphNode {
  id: string;
  label: string;
  type: "cluster" | "seller" | "buyer" | "product" | "payment" | "ip" | "device" | "order" | "review" | "refund";
  risk?: number;
}

export interface DashboardGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface DetectionDetail {
  key: keyof RiskBreakdown;
  label: string;
  confidence: number;
  summary: string;
  metrics: Record<string, string | number>;
  evidence: string[];
}

export interface TimelineEvent {
  time: string;
  event: string;
}

export interface CaseSummary {
  id: string;
  status: string;
  owner: string;
  priority: "High" | "Medium" | "Low";
  notes: string[];
  updatedAt: string;
}

export interface InvestigationReport {
  id: string;
  title: string;
  verdict: string;
  generatedAt: string;
  sections: Array<{
    title: string;
    body: string;
    bullets: string[];
  }>;
  recommendations: string[];
}

export interface DashboardPacket {
  cluster: {
    id: string;
    scenario: string;
    risk: {
      score: number;
      level: "HIGH" | "MEDIUM" | "LOW";
      breakdown: RiskBreakdown;
    };
  };
  summary: {
    buyers: number;
    sellers: number;
    orders: number;
    reviews: number;
    refunds: number;
    chargebacks: number;
  };
  primaryEntities: {
    sellerId: string;
    buyerIds: string[];
    productIds: string[];
  };
  detections: DetectionDetail[];
  timeline: TimelineEvent[];
  graph: {
    nodes: DashboardGraphNode[];
    edges: DashboardGraphEdge[];
  };
  case: CaseSummary;
  report: InvestigationReport;
}
