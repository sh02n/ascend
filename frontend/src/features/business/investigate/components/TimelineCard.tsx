import type { RiskLevel, TimelineEvent } from "../../../../shared/types/investigation";

const impactStyles: Record<RiskLevel, string> = {
  LOW: "bg-emerald-500",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-rose-500",
  CRITICAL: "bg-red-700",
};

interface TimelineCardProps {
  events: TimelineEvent[];
}

export function TimelineCard({ events }: TimelineCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Timeline</h3>
      <div className="mt-5 space-y-5">
        {events.map((event) => (
          <article key={event.id} className="relative border-l border-slate-200 pl-5">
            <span className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full ${impactStyles[event.riskImpact]}`} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold text-slate-900">{event.title}</h4>
              <span className="text-xs font-medium text-slate-500">{event.timestamp}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{event.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
