import type { MissingEvidenceItem, RiskLevel } from "../../types/investigation";

const priorityStyles: Record<RiskLevel, string> = {
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-rose-50 text-rose-700",
  CRITICAL: "bg-red-100 text-red-800",
};

interface MissingEvidenceListProps {
  items: MissingEvidenceItem[];
}

export function MissingEvidenceList({ items }: MissingEvidenceListProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
          ME
        </span>
        <h3 className="text-lg font-semibold text-slate-950">Missing Evidence</h3>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-md border border-dashed border-slate-300 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold text-slate-900">{item.evidence}</h4>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[item.priority]}`}>
                {item.priority} priority
              </span>
            </div>
            <p
              className="mt-2 overflow-hidden text-sm leading-5 text-slate-600"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {item.reason}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
