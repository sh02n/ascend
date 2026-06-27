import type { ReactNode } from "react";
import { SkeletonPlaceholder } from "./SkeletonPlaceholder";
import type { ImportPipelineSection } from "./importPipelineTypes";

type ImportSectionCardProps = ImportPipelineSection & {
  children?: ReactNode;
};

export function ImportSectionCard({
  title,
  description,
  state,
  skeleton,
  children,
}: ImportSectionCardProps) {
  const isExpanded = state === "expanded";

  return (
    <section
      className={`rounded-xl border bg-white shadow-sm ${
        isExpanded ? "border-slate-200" : "border-slate-200 opacity-60"
      }`}
      aria-disabled={!isExpanded}
    >
      <div className="flex items-start justify-between gap-5 border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium ${
            isExpanded
              ? "border-teal-200 bg-teal-50 text-teal-700"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          {isExpanded ? "Active" : "Locked"}
        </span>
      </div>
      <div className="p-5">{children ?? <SkeletonPlaceholder variant={skeleton} />}</div>
    </section>
  );
}
