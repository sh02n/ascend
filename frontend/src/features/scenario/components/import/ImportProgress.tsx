import type { ImportPipelineStage } from "./importPipelineTypes";

type ImportProgressProps = {
  stages: ImportPipelineStage[];
};

export function ImportProgress({ stages }: ImportProgressProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-5">
        {stages.map((stage, index) => {
          const isActive = stage.status === "active";

          return (
            <div
              key={stage.label}
              className={`rounded-lg border px-3 py-3 ${
                isActive
                  ? "border-teal-300 bg-teal-50 text-teal-900"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isActive
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-slate-300 bg-white text-slate-500"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-xs font-semibold leading-4">{stage.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

