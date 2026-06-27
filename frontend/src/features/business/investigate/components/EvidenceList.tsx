import type { EvidenceItem, RiskLevel } from "../../../../shared/types/investigation";

type EvidenceWithConfidence = EvidenceItem & {
  confidence?: number;
};

const severityStyles: Record<RiskLevel, string> = {
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-rose-50 text-rose-700",
  CRITICAL: "bg-red-100 text-red-800",
};

interface EvidenceListProps {
  evidence: EvidenceWithConfidence[];
}

function getSourceChips(source: string) {
  return source
    .split(/[,;:]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
          EV
        </span>
        <h3 className="text-lg font-semibold text-slate-950">Evidence</h3>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {evidence.map((item) => (
          <article key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityStyles[item.severity]}`}>
                  {item.severity}
                </span>
                <h4 className="mt-3 font-semibold text-slate-900">{item.label}</h4>
              </div>
              {item.confidence !== undefined ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {item.confidence}% confidence
                </span>
              ) : null}
            </div>
            <p
              className="mt-2 overflow-hidden text-sm leading-5 text-slate-600"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {item.detail}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {getSourceChips(item.source).map((source) => (
                <span key={source} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                  {source}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
