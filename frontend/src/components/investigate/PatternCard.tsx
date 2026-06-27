import type { PatternFinding } from "../../types/investigation";

interface PatternCardProps {
  pattern: PatternFinding;
}

export function PatternCard({ pattern }: PatternCardProps) {
  return (
    <section className="rounded-lg border border-teal-200 bg-teal-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-teal-700">
            PT
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Fraud Pattern Insight</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">{pattern.title}</h3>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-700">
          {pattern.confidence}% confidence
        </span>
      </div>
      <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-700">{pattern.description}</p>
      <div className="mt-4 rounded-md bg-white/70 p-4">
        <p className="text-sm font-semibold text-slate-900">Supporting indicators</p>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {pattern.indicators.map((indicator) => (
            <li key={indicator} className="flex gap-2 text-sm text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
              <span>{indicator}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
