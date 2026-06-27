import type { Recommendation, RiskLevel } from "../../../../shared/types/investigation";

const priorityStyles: Record<RiskLevel, string> = {
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-rose-50 text-rose-700",
  CRITICAL: "bg-red-100 text-red-800",
};

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
            RX
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendation</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">{recommendation.action}</h3>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[recommendation.priority]}`}>
          {recommendation.priority} priority
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{recommendation.rationale}</p>
      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-800">Next steps</p>
        <ol className="mt-3 space-y-2">
          {recommendation.nextSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm text-slate-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
