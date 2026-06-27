import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageShell } from "../../../../shared/components/PageShell";
import { getSessionDashboard, type SessionDashboard } from "../../../../core/session-flow/session.api";
import { storeActiveBusinessSession } from "../../../../core/session-flow/businessSession";
import { BusinessWorkflowTabs } from "../../session/BusinessWorkflowTabs";

function riskTone(level: string) {
  if (level === "HIGH") return "bg-rose-100 text-rose-700";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export function DashboardPage() {
  const { sessionId } = useParams();
  const [dashboard, setDashboard] = useState<SessionDashboard | null>(null);
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

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const nextDashboard = await getSessionDashboard(activeSessionId);
        if (!cancelled) {
          setDashboard(nextDashboard);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <PageShell title="Dashboard" description="Open a completed investigation session first.">
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          No session selected. Start from <Link className="font-semibold text-teal-700" to="/import">Import</Link>.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Dashboard" description="Final summary generated from the investigation session.">
      <BusinessWorkflowTabs active="dashboard" sessionId={sessionId} />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading && !dashboard ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          Building dashboard from session state...
        </div>
      ) : null}

      {dashboard ? (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                  {dashboard.overview.mode} session
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Final Investigation Summary</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{dashboard.overview.summary}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Risk score</p>
                <p className="mt-2 text-4xl font-semibold text-slate-950">{dashboard.overview.riskScore}</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskTone(dashboard.overview.riskLevel)}`}>
                  {dashboard.overview.riskLevel}
                </span>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {Object.entries(dashboard.metrics).map(([label, value]) => (
              <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-semibold text-slate-950">{value}</p>
                <p className="mt-2 text-sm font-medium capitalize text-slate-600">{label.replace(/([A-Z])/g, " $1")}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">Graph</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-slate-50 p-4">
                  <p className="text-3xl font-semibold text-slate-950">{dashboard.graph.nodes.length}</p>
                  <p className="mt-1 text-sm text-slate-500">Nodes</p>
                </div>
                <div className="rounded-md bg-slate-50 p-4">
                  <p className="text-3xl font-semibold text-slate-950">{dashboard.graph.edges.length}</p>
                  <p className="mt-1 text-sm text-slate-500">Edges</p>
                </div>
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">Report</h3>
              {dashboard.report ? (
                <div className="mt-4">
                  <p className="text-xl font-semibold text-slate-950">{dashboard.report.pattern.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{dashboard.report.recommendation.rationale}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No investigation report has been generated for this session.</p>
              )}
            </article>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
