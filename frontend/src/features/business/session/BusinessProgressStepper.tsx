import { Link } from "react-router-dom";

type Step = {
  label: string;
  status: "complete" | "active" | "pending";
  to?: string;
};

type BusinessProgressStepperProps = {
  steps: Step[];
  percent: number;
  detail?: string;
};

export function BusinessProgressStepper({ steps, percent, detail }: BusinessProgressStepperProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workflow Progress</p>
          {detail ? <p className="mt-1 text-sm font-medium text-slate-700">{detail}</p> : null}
        </div>
        <p className="font-mono text-sm font-semibold text-slate-700">{Math.round(percent)}%</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step, index) => {
          const content = (
            <span
              className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                step.status === "complete"
                  ? "border-teal-200 bg-teal-50 text-teal-800"
                  : step.status === "active"
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs text-slate-700">
                {index + 1}
              </span>
              {step.label}
            </span>
          );

          return step.status === "complete" && step.to ? (
            <Link key={step.label} to={step.to}>
              {content}
            </Link>
          ) : (
            <div key={step.label}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
