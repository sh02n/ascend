import { PageShell } from "../../../shared/components/PageShell";
import { GraphCanvas } from "../components/GraphCanvas";
import { CasePanel } from "../components/CasePanel";
import { ReportView } from "../components/ReportView";
import { useDashboard } from "../hooks/useDashboard";

const breakdownLabels = {
  sharedResource: "Shared Resource",
  reviewRing: "Review Ring",
  refundAbuse: "Refund Abuse",
  temporalBurst: "Temporal Burst",
  denseCluster: "Dense Cluster",
};

export function DashboardPage() {
  const dashboard = useDashboard();

  if (dashboard.status === "loading") {
    return (
      <PageShell title="Dashboard" description="Loading the review-ring investigation workspace.">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading cluster dashboard...
        </div>
      </PageShell>
    );
  }

  if (dashboard.status === "error") {
    return (
      <PageShell title="Dashboard" description="The investigation workspace could not load.">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {dashboard.error}
        </div>
      </PageShell>
    );
  }

  const data = dashboard.data;
  const summaryItems = Object.entries(data.summary);
  const breakdownItems = Object.entries(data.cluster.risk.breakdown) as Array<
    [keyof typeof data.cluster.risk.breakdown, number]
  >;

  return (
    <PageShell title="Cluster Dashboard" description="Fake Review Ring risk, graph, report, and case tracking workspace.">
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Card</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-950">{data.cluster.scenario}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {data.cluster.id} centered on {data.primaryEntities.sellerId} and {data.primaryEntities.productIds.join(", ")}.
              </p>
            </div>
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
              <div className="text-center">
                <p className="text-4xl font-bold leading-none">{data.cluster.risk.score}</p>
                <p className="mt-1 text-xs font-semibold">{data.cluster.risk.level}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {breakdownItems.map(([key, value]) => (
              <div key={key} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                  <span>{breakdownLabels[key]}</span>
                  <span>{value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.min(value * 4, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
          {summaryItems.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        {data.detections.map((detection) => (
          <article key={detection.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-950">{detection.label}</h4>
              <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">
                {Math.round(detection.confidence * 100)}%
              </span>
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-600">{detection.summary}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_420px]">
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Graph</p>
                <h3 className="text-lg font-semibold text-slate-950">Fraud Graph Visualisation</h3>
              </div>
              <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                {data.graph.nodes.length} nodes / {data.graph.edges.length} edges
              </span>
            </div>
            <GraphCanvas nodes={data.graph.nodes} edges={data.graph.edges} />
          </section>

          <ReportView caseId={data.case.id} detections={data.detections} report={data.report} />
        </div>

        <CasePanel caseSummary={data.case} timeline={data.timeline} />
      </div>
    </PageShell>
  );
}
