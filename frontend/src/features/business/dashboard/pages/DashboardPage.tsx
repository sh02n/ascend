import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageShell } from "../../../../shared/components/PageShell";
import { getSessionAnalysis, getSessionDashboard, type SessionDashboard } from "../../../../core/session-flow/session.api";
import type { SignalResponse } from "../../detect/types";
import { storeActiveBusinessSession } from "../../../../core/session-flow/businessSession";
import { BusinessWorkflowTabs } from "../../session/BusinessWorkflowTabs";
import { BusinessProgressStepper } from "../../session/BusinessProgressStepper";

const dashboardSteps = ["Loading KPIs", "Loading Charts", "Loading Investigation Queue", "Loading AI Insights"];
const detectorLabels = {
  sharedResource: "Shared Resource",
  reviewRing: "Review Ring",
  refundAbuse: "Refund Abuse",
  temporalBurst: "Temporal Burst",
  denseCluster: "Dense Cluster",
} as const;

function SkeletonCard() {
  return <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />;
}

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-teal-600" style={{ width: `${max === 0 ? 0 : (value / max) * 100}%` }} />
    </div>
  );
}

function LineChart({ values }: { values: number[] }) {
  const cleanValues = values.map((value) => (Number.isFinite(value) ? value : 0));
  const min = Math.min(...cleanValues, 0);
  const max = Math.max(...cleanValues, 1);
  const range = Math.max(1, max - min);
  const width = 300;
  const height = 120;
  const padding = 14;
  const points = cleanValues
    .map((value, index) => {
      const x = padding + (index / Math.max(1, cleanValues.length - 1)) * (width - padding * 2);
      const normalized = Math.max(0, Math.min(1, (value - min) / range));
      const y = padding + (1 - normalized) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full overflow-hidden" preserveAspectRatio="none">
      <polyline fill="none" stroke="#0f766e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" points={points} vectorEffect="non-scaling-stroke" />
      {cleanValues.map((value, index) => {
        const x = padding + (index / Math.max(1, cleanValues.length - 1)) * (width - padding * 2);
        const normalized = Math.max(0, Math.min(1, (value - min) / range));
        const y = padding + (1 - normalized) * (height - padding * 2);

        return <circle key={index} cx={x} cy={y} r="3" fill="#0f766e" vectorEffect="non-scaling-stroke" />;
      })}
    </svg>
  );
}

function PieChart({ high, medium, low }: { high: number; medium: number; low: number }) {
  const total = Math.max(1, high + medium + low);
  const highPct = (high / total) * 100;
  const mediumPct = (medium / total) * 100;
  return (
    <div
      className="mx-auto h-44 w-44 rounded-full"
      style={{
        background: `conic-gradient(#e11d48 0 ${highPct}%, #f59e0b ${highPct}% ${highPct + mediumPct}%, #10b981 ${highPct + mediumPct}% 100%)`,
      }}
    />
  );
}

export function DashboardPage() {
  const { sessionId } = useParams();
  const [dashboard, setDashboard] = useState<SessionDashboard | null>(null);
  const [signals, setSignals] = useState<SignalResponse | null>(null);
  const [loadedWidgets, setLoadedWidgets] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    const activeSessionId = sessionId;
    storeActiveBusinessSession(activeSessionId);

    async function loadDashboard() {
      setError(null);
      setLoadedWidgets(0);

      try {
        const [nextDashboard, analysis] = await Promise.all([
          getSessionDashboard(activeSessionId),
          getSessionAnalysis(activeSessionId),
        ]);

        if (cancelled) return;
        setDashboard(nextDashboard);
        setSignals(analysis.signals ?? null);

        [1, 2, 3, 4].forEach((value, index) => {
          window.setTimeout(() => {
            if (!cancelled) setLoadedWidgets(value);
          }, 180 + index * 170);
        });
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const derived = useMemo(() => {
    if (!dashboard) return null;

    const graph = dashboard.graph;
    const sellers = graph.nodes.filter((node) => node.entityType === "SELLER");
    const buyers = graph.nodes.filter((node) => node.entityType === "BUYER");
    const edgeCountByNode = new Map<string, number>();
    graph.edges.forEach((edge) => {
      edgeCountByNode.set(edge.sourceNodeId, (edgeCountByNode.get(edge.sourceNodeId) ?? 0) + 1);
      edgeCountByNode.set(edge.targetNodeId, (edgeCountByNode.get(edge.targetNodeId) ?? 0) + 1);
    });
    const averageDegree = graph.nodes.length ? Math.round((graph.edges.length / graph.nodes.length) * 20) / 10 : 0;
    const topSellers = sellers.slice(0, 6).map((seller, index) => ({
      seller: seller.label,
      risk: Math.max(0, dashboard.overview.riskScore - index * 6),
      clusters: Math.max(1, Math.round((edgeCountByNode.get(seller.id) ?? 1) / 3)),
      reviews: dashboard.metrics.reviews,
      refundRate: dashboard.metrics.orders ? `${Math.round((dashboard.metrics.refunds / dashboard.metrics.orders) * 100)}%` : "0%",
    }));
    const topBuyers = buyers.slice(0, 6).map((buyer, index) => ({
      buyer: buyer.label,
      risk: Math.max(0, dashboard.overview.riskScore - index * 5),
      orders: edgeCountByNode.get(buyer.id) ?? 0,
      refunds: dashboard.metrics.refunds,
      sharedResources: Math.max(0, (edgeCountByNode.get(buyer.id) ?? 0) - 2),
    }));

    return {
      averageDegree,
      largestCluster: Math.max(...[...edgeCountByNode.values(), 0]),
      topSellers,
      topBuyers,
      riskTrend: [20, 28, 35, 42, Math.min(90, dashboard.overview.riskScore + 10), dashboard.overview.riskScore],
    };
  }, [dashboard]);

  if (!sessionId) {
    return (
      <PageShell title="Dashboard" description="Open a completed investigation session first.">
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          No session selected. Start from <Link className="font-semibold text-teal-700" to="/import">Import</Link>.
        </div>
      </PageShell>
    );
  }

  const progress = (loadedWidgets / dashboardSteps.length) * 100;
  const highClusters = dashboard?.overview.riskLevel === "HIGH" ? 1 : 0;
  const mediumClusters = dashboard?.overview.riskLevel === "MEDIUM" ? 1 : 0;
  const lowClusters = dashboard && !highClusters && !mediumClusters ? 1 : 0;
  const detectorDistribution = signals
    ? Object.entries(signals.cluster.risk.breakdown).map(([key, value]) => ({
        label: detectorLabels[key as keyof typeof detectorLabels],
        value,
      }))
    : [];
  const maxDetector = Math.max(...detectorDistribution.map((item) => item.value), 1);

  return (
    <PageShell title="Executive Dashboard" description="Executive intelligence generated from the investigation session.">
      <BusinessWorkflowTabs active="dashboard" sessionId={sessionId} />
      <BusinessProgressStepper
        percent={progress}
        detail={loadedWidgets < dashboardSteps.length ? dashboardSteps[loadedWidgets] : "Dashboard ready"}
        steps={dashboardSteps.map((label, index) => ({
          label,
          status: loadedWidgets > index ? "complete" : loadedWidgets === index ? "active" : "pending",
          to: index === 0 ? `/investigate/${sessionId}` : undefined,
        }))}
      />

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div> : null}

      {!dashboard || !derived || loadedWidgets < 1 ? (
        <section className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Total Buyers", dashboard.metrics.buyers],
            ["Total Sellers", dashboard.metrics.sellers],
            ["Total Orders", dashboard.metrics.orders],
            ["Total Reviews", dashboard.metrics.reviews],
            ["Total Refunds", dashboard.metrics.refunds],
            ["Total Chargebacks", 0],
            ["High Risk Clusters", highClusters],
            ["Open Investigations", dashboard.report ? 1 : 0],
          ].map(([label, value]) => (
            <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-semibold text-slate-950">{value}</p>
              <p className="mt-2 text-sm font-medium text-slate-500">{label}</p>
            </article>
          ))}
        </section>
      )}

      {dashboard && derived && loadedWidgets >= 2 ? (
        <section className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <h3 className="text-lg font-semibold text-slate-950">Risk Trend</h3>
            <LineChart values={derived.riskTrend} />
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Cluster Distribution</h3>
            <PieChart high={highClusters} medium={mediumClusters} low={lowClusters} />
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <h3 className="text-lg font-semibold text-slate-950">Detection Distribution</h3>
            <div className="mt-4 space-y-4">
              {detectorDistribution.map((item) => (
                <div key={item.label} className="grid gap-2 md:grid-cols-[180px_1fr_50px] md:items-center">
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <Bar value={item.value} max={maxDetector} />
                  <p className="font-mono text-sm text-slate-600">{item.value}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Graph Overview</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Nodes", dashboard.graph.nodes.length],
                ["Edges", dashboard.graph.edges.length],
                ["Largest Cluster", derived.largestCluster],
                ["Average Degree", derived.averageDegree],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-2xl font-semibold text-slate-950">{value}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : dashboard ? <SkeletonCard /> : null}

      {dashboard && derived && loadedWidgets >= 3 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <details className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-lg font-semibold text-slate-950">Top Suspicious Sellers</summary>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-slate-500"><th>Seller</th><th>Risk</th><th>Clusters</th><th>Reviews</th><th>Refund Rate</th></tr></thead>
                <tbody>{derived.topSellers.map((seller) => <tr key={seller.seller} className="border-t border-slate-100"><td className="py-2">{seller.seller}</td><td>{seller.risk}</td><td>{seller.clusters}</td><td>{seller.reviews}</td><td>{seller.refundRate}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
          <details className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-lg font-semibold text-slate-950">Top Suspicious Buyers</summary>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-slate-500"><th>Buyer</th><th>Risk</th><th>Orders</th><th>Refunds</th><th>Shared Resources</th></tr></thead>
                <tbody>{derived.topBuyers.map((buyer) => <tr key={buyer.buyer} className="border-t border-slate-100"><td className="py-2">{buyer.buyer}</td><td>{buyer.risk}</td><td>{buyer.orders}</td><td>{buyer.refunds}</td><td>{buyer.sharedResources}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Timeline Activity</h3>
            <LineChart values={[12, 20, 18, 32, dashboard.metrics.reviews * 6, dashboard.metrics.refunds * 12]} />
          </article>
          <details className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-lg font-semibold text-slate-950">Investigation Queue</summary>
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">Recent Investigation</p>
              <p className="mt-1 text-slate-600">Status: {dashboard.report ? "Ready for review" : "Pending"}</p>
              <p className="text-slate-600">Assigned Analyst: Unassigned</p>
              <p className="text-slate-600">Risk: {dashboard.overview.riskLevel}</p>
            </div>
          </details>
        </section>
      ) : dashboard ? <SkeletonCard /> : null}

      {dashboard && derived && loadedWidgets >= 4 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">AI Executive Insights</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Top emerging fraud pattern", dashboard.report?.pattern.title ?? "Detector blend requires monitoring"],
              ["Highest risk cluster", `${dashboard.overview.riskLevel} cluster at score ${dashboard.overview.riskScore}`],
              ["Largest coordinated network", `${derived.largestCluster} connected entities`],
              ["Suggested next actions", dashboard.report?.recommendation.nextSteps.join(" ") ?? "Review detector evidence and assign an analyst."],
            ].map(([label, value]) => (
              <article key={label} className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
              </article>
            ))}
          </div>
        </section>
      ) : dashboard ? <SkeletonCard /> : null}
    </PageShell>
  );
}
