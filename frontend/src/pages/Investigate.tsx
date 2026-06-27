import { useEffect, useState } from "react";
import { EvidenceList } from "../components/investigate/EvidenceList";
import { FalsePositiveList } from "../components/investigate/FalsePositiveList";
import { InvestigationSummary } from "../components/investigate/InvestigationSummary";
import { InvestigatorChat } from "../components/investigate/InvestigatorChat";
import { MissingEvidenceList } from "../components/investigate/MissingEvidenceList";
import { PatternCard } from "../components/investigate/PatternCard";
import { RecommendationCard } from "../components/investigate/RecommendationCard";
import { TimelineCard } from "../components/investigate/TimelineCard";
import { investigateCluster } from "../features/investigate/api/investigate.api";
import {
  getDefaultInvestigationDemoCase,
  getInvestigationDemoCaseById,
  investigationDemoCases,
} from "../mock/investigationDemoCases";
import type { AiInvestigationReport, RiskLevel } from "../types/investigation";

const riskBadgeStyles: Record<RiskLevel, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-rose-200 bg-rose-50 text-rose-700",
  CRITICAL: "border-red-300 bg-red-50 text-red-800",
};

const riskGaugeStyles: Record<RiskLevel, string> = {
  LOW: "bg-emerald-500",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-rose-500",
  CRITICAL: "bg-red-700",
};

function getInvestigationErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("empty response")) {
    return "The investigation service returned no report. Please try again.";
  }

  return "We could not generate the investigation right now. Please try again.";
}

function getMetricValue(primary: number | string | undefined, fallback: string) {
  if (primary === undefined || primary === 0 || primary === "0" || primary === "Not applicable") {
    return fallback;
  }

  return primary;
}

function getMetricCards(investigationInput: ReturnType<typeof getDefaultInvestigationDemoCase>["investigationInput"]) {
  const signal = investigationInput.primarySignals[0] ?? "No dominant signal";
  const orders = investigationInput.primarySignals.join(" ").match(/(\d+)\s+orders/i)?.[1];
  const exposure = investigationInput.primarySignals.find((item) => item.includes("$")) ?? "N/A";
  const reviewsOrOrders = orders
    ? `${investigationInput.reviewCount || "N/A"} / ${orders}`
    : investigationInput.reviewCount;
  const ratingOrExposure =
    exposure !== "N/A" ? `${investigationInput.averageRating || "N/A"} / ${exposure}` : investigationInput.averageRating;
  const burstOrSignal =
    investigationInput.reviewBurstWindow === "Not applicable" || investigationInput.reviewBurstWindow === "No burst detected"
      ? signal
      : investigationInput.reviewBurstWindow;

  return [
    { label: "Reviewers / Buyers", value: investigationInput.entitiesReviewed },
    { label: "Products / Sellers", value: investigationInput.productCount },
    { label: "Reviews / Orders", value: getMetricValue(reviewsOrOrders, "N/A") },
    { label: "Avg rating / Exposure", value: getMetricValue(ratingOrExposure, exposure) },
    { label: "Review burst / Main signal", value: burstOrSignal },
    { label: "Risk score", value: investigationInput.riskScore },
  ];
}

export function Investigate() {
  const [selectedCaseId, setSelectedCaseId] = useState(getDefaultInvestigationDemoCase().id);
  const selectedCase = getInvestigationDemoCaseById(selectedCaseId);
  const investigationInput = selectedCase.investigationInput;
  const [report, setReport] = useState<AiInvestigationReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const metricCards = getMetricCards(investigationInput);
  const confidenceScore = report?.pattern.confidence;

  useEffect(() => {
    setReport(null);
    setErrorMessage(null);
    setIsGenerating(false);
  }, [selectedCaseId]);

  function selectCase(nextCaseId: string) {
    setSelectedCaseId(nextCaseId);
  }

  async function generateInvestigation() {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const [investigation] = await Promise.all([
        investigateCluster({ cluster: investigationInput }),
        new Promise((resolve) => window.setTimeout(resolve, 500)),
      ]);
      setReport(investigation);
    } catch (error) {
      setReport(null);
      setErrorMessage(getInvestigationErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">AI Investigation Workspace</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-950">{investigationInput.title}</h2>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  riskBadgeStyles[investigationInput.riskLevel]
                }`}
              >
                {investigationInput.riskLevel} RISK
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Under Investigation
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">Case ID: {investigationInput.clusterId}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:min-w-72">
              Select case
              <select
                value={selectedCaseId}
                onChange={(event) => selectCase(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                {investigationDemoCases.map((demoCase) => (
                  <option key={demoCase.id} value={demoCase.id}>
                    {demoCase.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={generateInvestigation}
              disabled={isGenerating}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isGenerating ? "Generating..." : "Generate Investigation"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {metricCards.map((metric) => (
            <div key={metric.label} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">{metric.label}</p>
              <p className="mt-2 truncate text-lg font-semibold text-slate-950">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800">Risk gauge</span>
              <span className="font-semibold text-slate-950">{investigationInput.riskScore}/100</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${riskGaugeStyles[investigationInput.riskLevel]}`}
                style={{ width: `${Math.min(Math.max(investigationInput.riskScore, 0), 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Confidence score</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {confidenceScore !== undefined ? `${confidenceScore}%` : "Pending"}
            </p>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {!report ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">No AI investigation generated yet.</h3>
          <p className="mt-2 text-sm text-slate-500">
            Generate an investigation to review the mock AI report for this cluster.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {report.source ? (
            <div className="flex justify-end">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {report.source === "openai" ? "AI generated" : "Fallback demo data"}
              </span>
            </div>
          ) : null}

          <InvestigationSummary
            summary={report.executiveSummary}
            generatedAt={report.generatedAt}
            reportId={report.reportId}
          />

          <RecommendationCard recommendation={report.recommendation} />

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <EvidenceList evidence={report.evidence} />
            <PatternCard pattern={report.pattern} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <FalsePositiveList items={report.falsePositives} />
            <MissingEvidenceList items={report.missingEvidence} />
          </div>

          <TimelineCard events={report.timeline} />

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Suggested Questions</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {report.suggestedQuestions.map((question) => (
                <div key={question.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-800">{question.question}</p>
                </div>
              ))}
            </div>
          </section>

          <InvestigatorChat
            cluster={investigationInput}
            investigation={report}
            questions={report.suggestedQuestions}
          />
        </div>
      )}
    </section>
  );
}
