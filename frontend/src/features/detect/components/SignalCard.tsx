import type { DetectorContext } from "../types";

interface SignalCardProps {
  name: string;
  context: DetectorContext;
}

function formatMetricValue(value: DetectorContext["metrics"][string]) {
  if (value === null) {
    return "n/a";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  return String(value);
}

export function SignalCard({ name, context }: SignalCardProps) {
  const confidence = Math.round(context.confidence * 100);
  const severity = context.detected && confidence >= 80 ? "high" : context.detected ? "medium" : "clear";
  const accentStyles = {
    high: {
      rail: "before:bg-[#FF5C7A]",
      pill: "bg-[#FF5C7A]/15 text-[#FF5C7A] ring-[#FF5C7A]/50",
      text: "text-[#FF5C7A]",
    },
    medium: {
      rail: "before:bg-[#FFB454]",
      pill: "bg-[#FFB454]/15 text-[#FFB454] ring-[#FFB454]/50",
      text: "text-[#FFB454]",
    },
    clear: {
      rail: "before:bg-[#7C88AA]",
      pill: "bg-[#36D6A0]/15 text-[#36D6A0] ring-[#36D6A0]/50",
      text: "text-[#36D6A0]",
    },
  }[severity];

  return (
    <article
      className={`relative overflow-hidden rounded-[18px] border border-[#202A42] bg-gradient-to-b from-[#10162A] to-[#0B0F1B] p-5 before:absolute before:inset-y-0 before:left-0 before:w-[3px] ${accentStyles.rail}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-[#EDEFF8]">{name}</h3>
          <p className="mt-1 max-w-md text-xs leading-5 text-[#94A0BE]">{context.summary}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] ring-1 ${accentStyles.pill}`}
        >
          {context.detected ? "Detected" : "Clear"}
        </span>
      </div>

      <div className="my-4 grid grid-cols-2 gap-3">
        <div className="rounded-[9px] border border-[#161E30] bg-[#161E36] p-3">
          <p className="text-[10px] tracking-wide text-[#586383]">Confidence</p>
          <p className={`mt-1 text-2xl font-bold ${accentStyles.text}`}>{confidence}%</p>
        </div>
        <div className="rounded-[9px] border border-[#161E30] bg-[#161E36] p-3">
          <p className="text-[10px] tracking-wide text-[#586383]">Score</p>
          <p className="mt-1 text-2xl font-bold text-[#EDEFF8]">{context.score}</p>
        </div>
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        {Object.entries(context.metrics).map(([metric, value]) => (
          <div key={metric} className="flex items-baseline justify-between border-b border-[#161E30] py-2">
            <p className="font-mono text-[11px] text-[#586383]">{metric}</p>
            <p className="font-mono text-xs font-medium text-[#EDEFF8]">{formatMetricValue(value)}</p>
          </div>
        ))}
      </div>

      <details className="group mt-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 py-2 text-xs font-semibold text-[#4C82FF] marker:hidden">
          <svg className="h-3 w-3 transition group-open:rotate-90" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Evidence ({context.evidence.length.toLocaleString()})
        </summary>
        <div className="mt-2 flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
          {context.evidence.length > 0 ? (
            context.evidence.slice(0, 100).map((item) => (
              <div
                key={item}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#161E30] bg-[#161E36] px-3 py-2 font-mono text-[11px] text-[#94A0BE]"
              >
                <b className="truncate font-medium text-[#EDEFF8]">{item}</b>
              </div>
            ))
          ) : (
            <span className="py-1 text-xs text-[#586383]">No evidence returned</span>
          )}
          {context.evidence.length > 100 ? (
            <span className="px-1 py-1 text-[11px] text-[#586383]">
              +{(context.evidence.length - 100).toLocaleString()} more records
            </span>
          ) : null}
        </div>
      </details>
    </article>
  );
}
