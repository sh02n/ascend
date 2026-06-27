export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ClusterEntity {
  id: string;
  type: "reviewer" | "product" | "review" | "device" | "ip";
  label: string;
  riskSignals: string[];
}

export interface InvestigationCluster {
  clusterId: string;
  title: string;
  riskLevel: RiskLevel;
  riskScore: number;
  scenario: string;
  entitiesReviewed: number;
  productCount: number;
  reviewCount: number;
  averageRating: number;
  reviewBurstWindow: string;
  primarySignals: string[];
  entities: ClusterEntity[];
}

export interface EvidenceItem {
  id: string;
  label: string;
  severity: RiskLevel;
  detail: string;
  source: string;
}

export interface PatternFinding {
  title: string;
  confidence: number;
  description: string;
  indicators: string[];
}

export interface FalsePositiveConsideration {
  id: string;
  consideration: string;
  assessment: string;
  likelihood: RiskLevel;
}

export interface MissingEvidenceItem {
  id: string;
  evidence: string;
  reason: string;
  priority: RiskLevel;
}

export interface Recommendation {
  action: string;
  priority: RiskLevel;
  rationale: string;
  nextSteps: string[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  riskImpact: RiskLevel;
}

export interface SuggestedQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface AiInvestigationReport {
  reportId: string;
  generatedAt: string;
  source?: "openai" | "fallback_mock";
  executiveSummary: string;
  evidence: EvidenceItem[];
  pattern: PatternFinding;
  falsePositives: FalsePositiveConsideration[];
  missingEvidence: MissingEvidenceItem[];
  recommendation: Recommendation;
  timeline: TimelineEvent[];
  suggestedQuestions: SuggestedQuestion[];
}

export interface InvestigateBody {
  cluster: InvestigationCluster;
}

export interface ExplainBody {
  question: string;
  cluster: InvestigationCluster;
  investigation: AiInvestigationReport;
}
