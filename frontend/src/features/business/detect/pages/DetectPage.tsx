import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../../../../shared/components/PageShell";
import { detectSession, getSessionAnalysis, getSessionDashboard, type SessionDashboard } from "../../../../core/session-flow/session.api";
import { storeActiveBusinessSession } from "../../../../core/session-flow/businessSession";
import { BusinessWorkflowTabs } from "../../session/BusinessWorkflowTabs";
import { BusinessProgressStepper } from "../../session/BusinessProgressStepper";
import { SessionGraph } from "../components/SessionGraph";
import type { DetectorKey, SignalResponse } from "../types";

const detectorLabels: Record<DetectorKey, string> = {
  sharedResource: "Shared Resource",
  reviewRing: "Review Ring",
  refundAbuse: "Refund Abuse",
  temporalBurst: "Temporal Burst",
  denseCluster: "Dense Cluster",
};

const flowSteps = ["Dataset Loaded", "Graph Generated", "Fraud Signals", "Evidence Ready", "Investigation Ready"];
const emptyGraph: SessionDashboard["graph"] = { nodes: [], edges: [] };

function riskTone(level?: string) {
  if (level === "HIGH") return "bg-rose-100 text-rose-700";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function isSparseGraph(graph?: SessionDashboard["graph"]) {
  return !graph || graph.nodes.length < 3 || graph.edges.length < 2;
}

function countFrom(value: number | undefined, fallback: number, max: number) {
  return Math.max(1, Math.min(max, value && value > 0 ? value : fallback));
}

function buildEnrichedGraph(graph: SessionDashboard["graph"] | undefined, signals: SignalResponse | null) {
  const baseGraph = graph ?? emptyGraph;

  if (!signals || !isSparseGraph(baseGraph)) {
    return { graph: baseGraph, enriched: false };
  }

  const nodes: SessionDashboard["graph"]["nodes"] = [...baseGraph.nodes];
  const edges: SessionDashboard["graph"]["edges"] = [...baseGraph.edges];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edgeIds = new Set(edges.map((edge) => edge.id));

  function addNode(entityType: string, id: string, label: string) {
    if (!nodeIds.has(id)) {
      nodes.push({ id, entityType, label });
      nodeIds.add(id);
    }
    return id;
  }

  function addEdge(sourceNodeId: string, targetNodeId: string, relationship: string) {
    if (!nodeIds.has(sourceNodeId) || !nodeIds.has(targetNodeId)) return;

    const id = `enriched-edge-${sourceNodeId}-${targetNodeId}-${relationship}`;
    if (!edgeIds.has(id)) {
      edges.push({ id, sourceNodeId, targetNodeId, relationship });
      edgeIds.add(id);
    }
  }

  const clusterId = addNode("CLUSTER", "enriched-risk-cluster", `${signals.cluster.risk.level} risk cluster`);
  const buyerId = addNode("BUYER", "enriched-buyers", `Buyer cohort (${signals.summary.buyers})`);
  const sellerId = addNode("SELLER", "enriched-sellers", `Seller cohort (${signals.summary.sellers})`);
  const orderId = addNode("ORDER", "enriched-orders", `Order activity (${signals.summary.orders})`);
  const reviewId = addNode("REVIEW", "enriched-reviews", `Review activity (${signals.summary.reviews})`);

  addEdge(clusterId, buyerId, "aggregates buyers");
  addEdge(clusterId, sellerId, "aggregates sellers");
  addEdge(buyerId, orderId, "placed orders");
  addEdge(orderId, sellerId, "purchased from");
  addEdge(orderId, reviewId, "generated reviews");
  addEdge(reviewId, sellerId, "reviews seller");

  if (signals.summary.refunds > 0 || signals.detections.refundAbuse) {
    const refundId = addNode("REFUND", "enriched-refunds", `Refund activity (${signals.summary.refunds})`);
    addEdge(orderId, refundId, "refund history");
    addEdge(refundId, clusterId, "risk contribution");
  }

  if (signals.detections.sharedResource) {
    const paymentId = addNode("PAYMENT_METHOD", "enriched-payment", "Shared payment signal");
    const deviceId = addNode("DEVICE", "enriched-device", "Shared device signal");
    const ipId = addNode("IP_ADDRESS", "enriched-ip", "Shared IP signal");
    addEdge(buyerId, paymentId, "shared resource");
    addEdge(buyerId, deviceId, "shared resource");
    addEdge(buyerId, ipId, "shared resource");
    addEdge(paymentId, clusterId, "connects cluster");
    addEdge(deviceId, clusterId, "connects cluster");
    addEdge(ipId, clusterId, "connects cluster");
  }

  (Object.keys(signals.reasoningContext) as DetectorKey[]).forEach((key) => {
    const context = signals.reasoningContext[key];
    if (!context.detected && context.score <= 0 && context.confidence <= 0) return;

    const signalId = addNode("SIGNAL", `enriched-signal-${key}`, detectorLabels[key]);
    addEdge(signalId, clusterId, context.detected ? "flagged detector" : "weak detector signal");
  });

  const existingNodes = baseGraph.nodes.slice(0, countFrom(baseGraph.nodes.length, 1, 12));
  existingNodes.forEach((node) => addEdge(clusterId, node.id, "session entity"));

  return { graph: { nodes, edges }, enriched: true };
}

export function DetectPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [signals, setSignals] = useState<SignalResponse | null>(null);
  const [dashboard, setDashboard] = useState<SessionDashboard | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeSearch, setNodeSearch] = useState("");
  const [progress, setProgress] = useState(8);
  const [progressLabel, setProgressLabel] = useState("Dataset Loaded");
  const [expandedDetectors, setExpandedDetectors] = useState<Set<DetectorKey>>(new Set());
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  const selectNode = useCallback((nodeId: string) => setSelectedNodeId(nodeId), []);
  const graph = dashboard?.graph;
  const graphView = useMemo(() => buildEnrichedGraph(graph, signals), [graph, signals]);
  const displayGraph = graphView.graph;
  const searchedNodes = useMemo(() => {
    const query = nodeSearch.trim().toLowerCase();
    if (!query) return [];
    return displayGraph.nodes.filter((node) => `${node.label} ${node.entityType}`.toLowerCase().includes(query)).slice(0, 8);
  }, [displayGraph.nodes, nodeSearch]);

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
      setProgress(18);
      setProgressLabel("Graph Construction");

      try {
        const existing = await getSessionAnalysis(activeSessionId);
        setProgress(42);
        setProgressLabel("Running Fraud Detectors");
        const nextSignals = existing.signals ?? (await detectSession(activeSessionId));
        setProgress(72);
        setProgressLabel("Preparing Evidence Trail");
        const nextDashboard = await getSessionDashboard(activeSessionId);

        if (!cancelled) {
          setSignals(nextSignals);
          setDashboard(nextDashboard);
          setProgress(100);
          setProgressLabel("Investigation Ready");
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to run detection");
      } finally {
        if (!cancelled) setIsLoading(false);
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

  const detectorKeys = signals ? (Object.keys(signals.reasoningContext) as DetectorKey[]) : [];
  const flaggedAccounts = signals ? Object.values(signals.reasoningContext).filter((context) => context.detected).length : 0;
  const evidenceGroups = displayGraph
    ? [
        ["Buyer", displayGraph.nodes.filter((node) => node.entityType === "BUYER")],
        ["Shared Payment", displayGraph.nodes.filter((node) => node.entityType === "PAYMENT_METHOD")],
        ["Shared Device", displayGraph.nodes.filter((node) => node.entityType === "DEVICE")],
        ["Shared IP", displayGraph.nodes.filter((node) => node.entityType === "IP_ADDRESS")],
        ["Orders", displayGraph.nodes.filter((node) => node.entityType === "ORDER")],
        ["Reviews", displayGraph.nodes.filter((node) => node.entityType === "REVIEW")],
        ["Refunds", displayGraph.nodes.filter((node) => node.entityType === "REFUND")],
      ] as const
    : [];

  return (
    <PageShell title="Fraud Detection" description="Graph investigation workspace for this session.">
      <BusinessWorkflowTabs active="fraud" sessionId={sessionId} />
      <BusinessProgressStepper
        percent={progress}
        detail={`${progressLabel} ${isLoading ? "in progress" : "complete"}`}
        steps={flowSteps.map((label, index) => ({
          label,
          status: progress >= ((index + 1) / flowSteps.length) * 100 ? "complete" : progress >= (index / flowSteps.length) * 100 ? "active" : "pending",
          to: index === 0 ? "/import" : undefined,
        }))}
      />

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div> : null}

      {isLoading && !signals ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {signals && dashboard ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Overall Risk Score", signals.cluster.risk.score],
              ["Risk Level", signals.cluster.risk.level],
              ["Cluster Count", Math.max(1, flaggedAccounts)],
              ["Flagged Accounts", flaggedAccounts],
              ["Suspicious Sellers", signals.reasoningContext.sharedResource.detected ? signals.summary.sellers : 0],
            ].map(([label, value]) => (
              <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
                {label === "Risk Level" ? <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskTone(String(value))}`}>{value}</span> : null}
              </article>
            ))}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Interactive Node Graph</h3>
                <p className="text-sm text-slate-500">Zoom, pan, search, select, and highlight connected entities.</p>
              </div>
              <button type="button" onClick={() => setIsGraphOpen((value) => !value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold">
                {isGraphOpen ? "Collapse graph" : "Expand graph"}
              </button>
            </div>
            {isGraphOpen ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_260px]">
                <div className="space-y-3">
                  {graphView.enriched ? (
                    <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                      The imported data did not contain enough linked cluster entities to draw a dense network, so this view was enriched from the session’s detector signals and dataset profile.
                    </div>
                  ) : null}
                  <SessionGraph graph={displayGraph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
                </div>
                <aside className="rounded-lg bg-slate-50 p-4">
                  <input value={nodeSearch} onChange={(event) => setNodeSearch(event.target.value)} placeholder="Search nodes..." className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
                  <div className="mt-3 space-y-2">
                    {searchedNodes.map((node) => (
                      <button key={node.id} type="button" onClick={() => setSelectedNodeId(node.id)} className="w-full rounded-md bg-white px-3 py-2 text-left text-sm hover:bg-teal-50">
                        <span className="font-semibold text-slate-900">{node.label}</span>
                        <span className="block text-xs text-slate-500">{node.entityType}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-slate-500">Selected node: {selectedNodeId ?? "None"}</p>
                </aside>
              </div>
            ) : null}
          </section>

          <details className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" open={isEvidenceOpen} onToggle={(event) => setIsEvidenceOpen(event.currentTarget.open)}>
            <summary className="cursor-pointer text-lg font-semibold text-slate-950">Evidence Trail</summary>
            {isEvidenceOpen ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {evidenceGroups.map(([label, nodes]) => (
                  <section key={label} className="rounded-lg bg-slate-50 p-4">
                    <h4 className="font-semibold text-slate-900">{label}</h4>
                    <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                      {nodes.slice(0, 20).map((node) => (
                        <button key={node.id} type="button" onClick={() => setSelectedNodeId(node.id)} className="block w-full rounded-md bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-teal-50">
                          {node.label}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}
          </details>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {detectorKeys.map((key) => {
              const context = signals.reasoningContext[key];
              const isExpanded = expandedDetectors.has(key);
              return (
                <article key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDetectors((current) => {
                        const next = new Set(current);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      })
                    }
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span className="text-base font-semibold text-slate-950">{detectorLabels[key]}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${context.detected ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {Math.round(context.confidence * 100)}%
                    </span>
                  </button>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{context.summary}</p>
                  {isExpanded ? (
                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(context.metrics).map(([metric, value]) => (
                          <div key={metric} className="rounded-md bg-slate-50 p-3 text-sm">
                            <p className="text-xs text-slate-500">{metric}</p>
                            <p className="font-semibold text-slate-900">{String(value ?? "n/a")}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Evidence</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {context.evidence.slice(0, 20).map((item) => (
                            <span key={item} className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">{item}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>

          <div className="flex justify-end">
            <button type="button" onClick={() => navigate(`/investigate/${sessionId}`)} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
              Begin Investigation
            </button>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
