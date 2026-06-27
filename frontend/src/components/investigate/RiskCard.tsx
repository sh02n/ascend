import type { InvestigationCluster, RiskLevel } from "../../types/investigation";

const riskStyles: Record<RiskLevel, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-rose-200 bg-rose-50 text-rose-700",
  CRITICAL: "border-red-300 bg-red-50 text-red-800",
};

interface RiskCardProps {
  cluster: InvestigationCluster;
}

export function RiskCard({ cluster }: RiskCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{cluster.clusterId}</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">{cluster.title}</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{cluster.scenario}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskStyles[cluster.riskLevel]}`}>
          {cluster.riskLevel} RISK
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Risk score</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{cluster.riskScore}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Reviewers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{cluster.entitiesReviewed}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Products</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{cluster.productCount}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Reviews</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{cluster.reviewCount}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Avg. rating</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{cluster.averageRating}</p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-semibold text-amber-900">Review burst: {cluster.reviewBurstWindow}</p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-800">Primary signals</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {cluster.primarySignals.map((signal) => (
            <span key={signal} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {signal}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
