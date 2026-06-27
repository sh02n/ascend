import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { getClusters, getSignals } from "../api/detect.api";
import { ClusterCard } from "../components/ClusterCard";
import { DetectErrorBoundary } from "../components/DetectErrorBoundary";
import { RiskCard } from "../components/RiskCard";
import type { ClusterSummary, DetectorKey, SignalResponse } from "../types";

const FraudGraph = lazy(() =>
  import("../components/FraudGraph").then((module) => ({ default: module.FraudGraph })),
);
const SignalCard = lazy(() =>
  import("../components/SignalCard").then((module) => ({ default: module.SignalCard })),
);
const Timeline = lazy(() =>
  import("../components/Timeline").then((module) => ({ default: module.Timeline })),
);

const detectorLabels: Record<DetectorKey, string> = {
  sharedResource: "Shared Resource",
  reviewRing: "Review Ring",
  refundAbuse: "Refund Abuse",
  temporalBurst: "Temporal Burst",
  denseCluster: "Dense Cluster",
};
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

function ClusterSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-16 animate-pulse rounded-[14px] border border-[#202A42] bg-[#10162A]" />
      ))}
    </div>
  );
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-[18px] border border-[#202A42] bg-gradient-to-b from-[#10162A] to-[#0B0F1B] p-8 text-center">
      <h2 className="text-lg font-semibold text-[#EDEFF8]">No clusters returned</h2>
      <p className="mt-2 text-sm text-[#586383]">Run a scenario import, then refresh detection results.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-[10px] border border-[#4C82FF]/50 bg-[#4C82FF]/15 px-4 py-2 text-sm font-semibold text-[#EDEFF8]"
      >
        Retry
      </button>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const friendlyMessage = message.includes("Failed to fetch")
    ? "The detection backend is not reachable. Start the backend and retry."
    : message;

  return (
    <section className="rounded-[18px] border border-[#FF5C7A]/40 bg-[#FF5C7A]/10 p-5">
      <h2 className="text-lg font-semibold text-[#FF5C7A]">Detection API error</h2>
      <p className="mt-2 text-sm text-[#EDEFF8]">{friendlyMessage}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-[10px] border border-[#FF5C7A]/50 bg-[#FF5C7A]/15 px-4 py-2 text-sm font-semibold text-[#EDEFF8]"
      >
        Retry
      </button>
    </section>
  );
}

function ReasoningContext({ signals }: { signals: SignalResponse }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[17px] font-semibold text-[#EDEFF8]">Reasoning Context</h2>
        <p className="mt-1 text-xs text-[#586383]">Why each detector scored the way it did</p>
      </div>
      <div className="space-y-2">
        {(Object.keys(signals.reasoningContext) as DetectorKey[]).map((key) => {
          const context = signals.reasoningContext[key];
          const dotColor = context.detected && context.confidence >= 0.8
            ? "bg-[#FF5C7A]"
            : context.detected
              ? "bg-[#FFB454]"
              : "bg-[#7C88AA]";

          return (
            <details
              key={key}
              className="group overflow-hidden rounded-[14px] border border-[#202A42] bg-[#10162A]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
                <span className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                  <span className="text-sm font-semibold text-[#EDEFF8]">{detectorLabels[key]}</span>
                  <span className="font-mono text-xs text-[#94A0BE]">{Math.round(context.confidence * 100)}%</span>
                </span>
                <svg className="h-3.5 w-3.5 text-[#586383] transition group-open:rotate-180" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="border-t border-[#161E30] px-4 pb-4 pt-3 text-sm leading-6 text-[#94A0BE]">
                <p>{context.summary}</p>
                <details className="mt-3 rounded-[9px] border border-[#161E30] bg-[#0B0F1B] p-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-[#4C82FF]">
                    Evidence ({context.evidence.length})
                  </summary>
                  <div className="mt-3 max-h-40 overflow-y-auto pr-1">
                    <div className="flex flex-wrap gap-2">
                      {context.evidence.length > 0 ? (
                        context.evidence.slice(0, 80).map((item) => (
                          <span key={item} className="rounded bg-[#161E36] px-2 py-1 font-mono text-xs text-[#94A0BE]">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#586383]">None</span>
                      )}
                      {context.evidence.length > 80 ? (
                        <span className="rounded bg-[#161E36] px-2 py-1 font-mono text-xs text-[#586383]">
                          +{context.evidence.length - 80} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                </details>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(context.metrics).map(([metric, value]) => (
                    <div key={metric} className="rounded-[9px] border border-[#161E30] px-3 py-2">
                      <p className="font-mono text-[11px] text-[#586383]">{metric}</p>
                      <p className="mt-1 text-sm font-semibold text-[#EDEFF8]">
                        {value === null ? "n/a" : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function DetectPage() {
  const renderStartedAt = useRef(performance.now());
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [signals, setSignals] = useState<SignalResponse | undefined>();
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const renderMs = Math.round(performance.now() - renderStartedAt.current);
    console.info(`[Detect UI] render ${renderMs}ms`);
  });

  useEffect(() => {
    let cancelled = false;

    async function loadClusters() {
      setLoadingClusters(true);
      setError(null);

      try {
        const nextClusters = await getClusters({ page: 1, limit: 20 });
        const sortedClusters = [...nextClusters].sort((left, right) => right.score - left.score);

        if (cancelled) {
          return;
        }

        setClusters(sortedClusters);
        setSelectedClusterId((currentClusterId) => currentClusterId ?? sortedClusters[0]?.id ?? null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load clusters");
        }
      } finally {
        if (!cancelled) {
          setLoadingClusters(false);
        }
      }
    }

    loadClusters();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (!selectedClusterId) {
      setSignals(undefined);
      return;
    }

    let cancelled = false;
    const clusterId = selectedClusterId;

    async function loadSignals() {
      setLoadingSignals(true);
      setError(null);

      try {
        const nextSignals = await getSignals(clusterId);

        if (cancelled) {
          return;
        }

        setSignals(nextSignals);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load detection signals");
        }
      } finally {
        if (!cancelled) {
          setLoadingSignals(false);
        }
      }
    }

    loadSignals();

    return () => {
      cancelled = true;
    };
  }, [selectedClusterId, reloadToken]);

  const selectedRisk = signals?.cluster.risk;

  return (
    <DetectErrorBoundary>
      <div className="relative min-h-screen overflow-hidden bg-[#06080F] text-[#EDEFF8]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(900px_560px_at_18%_-8%,rgba(76,130,255,.16),transparent_60%),radial-gradient(700px_480px_at_96%_10%,rgba(255,92,122,.09),transparent_60%)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(#161E30_1px,transparent_1px),linear-gradient(90deg,#161E30_1px,transparent_1px)] bg-[size:64px_64px] opacity-30 [mask-image:linear-gradient(180deg,rgba(0,0,0,.7),transparent_34%)]" />

        <nav className="relative z-10 flex items-center justify-between border-b border-[#161E30] px-5 py-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 16L6 9M16 16L26 9M16 16L6 23M16 16L26 23" stroke="#2C3754" strokeWidth="1.4" />
              <circle cx="16" cy="16" r="3.2" fill="#4C82FF" />
              <circle cx="6" cy="9" r="2" fill="#FF5C7A" />
              <circle cx="26" cy="9" r="2" fill="#FFB454" />
              <circle cx="6" cy="23" r="2" fill="#36D6A0" />
              <circle cx="26" cy="23" r="2" fill="#7C88AA" />
            </svg>
            <div>
              <h1 className="font-['Space_Grotesk'] text-base font-bold leading-tight tracking-tight">Ascend</h1>
              <p className="mt-0.5 text-[11px] tracking-wide text-[#586383]">Feature-first hackathon scaffold</p>
            </div>
          </div>
          <div className="hidden items-center gap-1 md:flex">
            {["Scenario", "Detect", "Investigate", "Dashboard"].map((item) => (
              <span
                key={item}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-medium ${
                  item === "Detect"
                    ? "bg-[#4C82FF]/15 text-[#EDEFF8] ring-1 ring-[#4C82FF]/50"
                    : "text-[#94A0BE]"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </nav>

        <header className="relative z-10 flex flex-col gap-4 px-5 py-7 md:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-['Space_Grotesk'] text-[26px] font-bold tracking-tight text-white">
              Fraud Detection Workspace
            </h2>
            <p className="mt-1.5 text-[13px] text-[#94A0BE]">Investigate suspicious marketplace behavior</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#36D6A0]/15 px-3 py-2 font-mono text-[11px] text-[#36D6A0] ring-1 ring-[#36D6A0]/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[#36D6A0] shadow-[0_0_0_5px_rgba(54,214,160,.08)]" />
              synced just now
            </span>
            {DEMO_MODE ? (
              <span className="rounded-[10px] border border-[#4C82FF]/40 bg-[#4C82FF]/10 px-3 py-2 text-xs font-semibold text-[#EDEFF8]">
                Demo Mode
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#202A42] bg-[#10162A] px-4 py-2 text-sm font-semibold text-[#EDEFF8] transition hover:border-[#4C82FF]/50 hover:bg-[#161E36]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M13.5 8a5.5 5.5 0 1 1-1.7-3.97M13.5 8V3.5M13.5 8H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Refresh
            </button>
          </div>
        </header>

        {error ? (
          <div className="relative z-10 px-5 md:px-8">
            <ErrorState message={error} onRetry={() => setReloadToken((token) => token + 1)} />
          </div>
        ) : null}

        <div className="relative z-10 grid items-start gap-5 px-5 md:px-8 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-[18px] border border-[#202A42] bg-gradient-to-b from-[#10162A] to-[#0B0F1B] p-4">
            <div className="px-1 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#586383]">Clusters</h2>
              <p className="mt-1 text-xs text-[#586383]">Highest risk first</p>
            </div>

            {loadingClusters ? <ClusterSkeleton /> : null}
            {!loadingClusters && clusters.length === 0 ? (
              <EmptyState onRetry={() => setReloadToken((token) => token + 1)} />
            ) : null}
            {!loadingClusters && clusters.length > 0 ? (
              <div className="space-y-3">
                {clusters.map((cluster) => (
                  <ClusterCard
                    key={cluster.id}
                    cluster={cluster}
                    selected={cluster.id === selectedClusterId}
                    onSelect={setSelectedClusterId}
                  />
                ))}
              </div>
            ) : null}
            <div className="mt-4 rounded-[14px] border border-dashed border-[#202A42] px-3 py-3 text-[11px] leading-5 text-[#586383]">
              <b className="font-semibold text-[#94A0BE]">{clusters.length}</b> clusters returned this scan ·{" "}
              <b className="font-semibold text-[#94A0BE]">
                {clusters.filter((cluster) => cluster.level === "HIGH").length}
              </b>{" "}
              high severity
            </div>
          </aside>

          <main className="space-y-5">
            <RiskCard risk={selectedRisk} />
            <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-slate-900" />}>
              <FraudGraph signals={signals} />
            </Suspense>

            <section className="pt-2">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="font-['Space_Grotesk'] text-[17px] font-semibold text-[#EDEFF8]">
                    Detection Signals
                  </h2>
                  <p className="mt-1 text-xs text-[#586383]">Completed Person-2 detectors</p>
                </div>
                {loadingSignals ? <span className="font-mono text-xs text-[#4C82FF]">Loading signals</span> : null}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Suspense
                  fallback={[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-64 animate-pulse rounded-[18px] bg-[#10162A]" />
                  ))}
                >
                  {signals
                    ? (Object.keys(signals.reasoningContext) as DetectorKey[]).map((key) => (
                        <SignalCard
                          key={key}
                          name={detectorLabels[key]}
                          context={signals.reasoningContext[key]}
                        />
                      ))
                    : [0, 1, 2, 3].map((item) => (
                        <div key={item} className="h-64 animate-pulse rounded-lg bg-slate-900" />
                      ))}
                </Suspense>
              </div>
            </section>

            {signals ? <ReasoningContext signals={signals} /> : null}
            <Suspense fallback={<div className="h-56 animate-pulse rounded-lg bg-slate-900" />}>
              <Timeline events={signals?.timeline ?? []} />
            </Suspense>
          </main>
        </div>

        <footer className="relative z-10 px-5 py-9 text-center text-[11px] text-[#586383] md:px-8">
          {selectedClusterId ?? "no cluster"} · last scanned just now · Ascend fraud detection scaffold
        </footer>
      </div>
    </DetectErrorBoundary>
  );
}
