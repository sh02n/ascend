import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { PageShell } from "../../../shared/components/PageShell";
import { getSessionAnalysis, investigateSession, type SessionInvestigation } from "../../../core/session-flow/session.api";
import { storeActiveBusinessSession } from "../../../core/session-flow/businessSession";
import { BusinessWorkflowTabs } from "../session/BusinessWorkflowTabs";

function priorityTone(priority: string) {
  if (priority === "HIGH" || priority === "CRITICAL") return "bg-rose-100 text-rose-700";
  if (priority === "MEDIUM") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export function Investigate() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<SessionInvestigation | null>(null);
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

    async function loadInvestigation() {
      setIsLoading(true);
      setError(null);

      try {
        const existing = await getSessionAnalysis(activeSessionId);
        const nextReport = existing.investigation ?? (await investigateSession(activeSessionId));

        if (!cancelled) {
          setReport(nextReport);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to generate investigation");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInvestigation();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <PageShell title="Investigation" description="Run detection before opening an investigation.">
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          No session selected. Start from <Link className="font-semibold text-teal-700" to="/import">Import</Link>.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Investigation" description="Evidence, pattern, timeline, and recommendation from this session.">
      <BusinessWorkflowTabs active="investigation" sessionId={sessionId} />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading && !report ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          Generating investigation from detector output...
        </div>
      ) : null}

      {report ? (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Session {sessionId}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{report.pattern.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{report.pattern.description}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Confidence</p>
                <p className="mt-2 text-4xl font-semibold text-slate-950">{report.pattern.confidence}%</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(`/dashboard/${sessionId}`)}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Next: Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setReport(null);
                  void investigateSession(sessionId).then(setReport).catch((reloadError) => {
                    setError(reloadError instanceof Error ? reloadError.message : "Unable to regenerate investigation");
                  });
                }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Regenerate
              </button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">Evidence</h3>
              <div className="mt-4 space-y-3">
                {report.evidence.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(item.severity)}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.source}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">Recommendation</h3>
              <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(report.recommendation.priority)}`}>
                {report.recommendation.priority}
              </span>
              <p className="mt-4 text-xl font-semibold text-slate-950">{report.recommendation.action}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{report.recommendation.rationale}</p>
              <div className="mt-5 space-y-2">
                {report.recommendation.nextSteps.map((step) => (
                  <p key={step} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {step}
                  </p>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Timeline</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {report.timeline.map((event) => (
                <article key={event.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{event.timestamp}</p>
                  <p className="mt-2 font-semibold text-slate-950">{event.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{event.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
