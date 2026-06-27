import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../../../../shared/components/PageShell";
import { detectSession, getSessionAnalysis } from "../../../../core/session-flow/session.api";
import { storeActiveBusinessSession } from "../../../../core/session-flow/businessSession";
import { BusinessWorkflowTabs } from "../../session/BusinessWorkflowTabs";
import type { DetectorKey, SignalResponse } from "../types";

const detectorLabels: Record<DetectorKey, string> = {
  sharedResource: "Shared Resource",
  reviewRing: "Review Ring",
  refundAbuse: "Refund Abuse",
  temporalBurst: "Temporal Burst",
  denseCluster: "Dense Cluster",
};

function riskTone(level?: string) {
  if (level === "HIGH") return "bg-rose-100 text-rose-700";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export function DetectPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [signals, setSignals] = useState<SignalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const activeSessionId = sessionId;
    storeActiveBusinessSession(activeSessionId);

    async function runDetection() {
      setIsLoading(true);
      setError(null);

      try {
        const existing = await getSessionAnalysis(activeSessionId);
        const nextSignals = existing.signals ?? (await detectSession(activeSessionId));

        if (!cancelled) {
          setSignals(nextSignals);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to run detection");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void runDetection();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <PageShell title="Fraud Detection" description="Import a CSV to create a session before running detectors.">
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          No investigation session selected. Start from <Link className="font-semibold text-teal-700" to="/import">Import</Link>.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Fraud Detection" description="Detector output generated from this investigation session.">
      <BusinessWorkflowTabs active="fraud" sessionId={sessionId} />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading && !signals ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          Running detectors against the imported session graph...
        </div>
      ) : null}

      {signals ? (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Session {sessionId}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Detection Complete</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {signals.summary.reviews} reviews, {signals.summary.buyers} buyers, {signals.summary.sellers} sellers,
                  and {signals.summary.refunds} refunds were analysed from the uploaded data.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Risk score</p>
                <p className="mt-2 text-4xl font-semibold text-slate-950">{signals.cluster.risk.score}</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskTone(signals.cluster.risk.level)}`}>
                  {signals.cluster.risk.level}
                </span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(`/investigate/${sessionId}`)}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Next: Investigation
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignals(null);
                  void detectSession(sessionId).then(setSignals).catch((reloadError) => {
                    setError(reloadError instanceof Error ? reloadError.message : "Unable to rerun detection");
                  });
                }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Rerun Detection
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(Object.keys(signals.reasoningContext) as DetectorKey[]).map((key) => {
              const context = signals.reasoningContext[key];
              return (
                <article key={key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-950">{detectorLabels[key]}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${context.detected ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {context.detected ? "flagged" : "clear"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{context.summary}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <span>Confidence: {Math.round(context.confidence * 100)}%</span>
                    <span>Impact: {signals.cluster.risk.breakdown[key]}</span>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
