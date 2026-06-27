import type { DatasetAnalysis } from "../../api/import.api";

type DatasetIntelligenceCardProps = {
  analysis: DatasetAnalysis;
};

export function DatasetIntelligenceCard({ analysis }: DatasetIntelligenceCardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Detected Dataset Type</p>
          <p className="mt-2 text-xl font-semibold text-ink">{analysis.detectedDatasetType}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Confidence</p>
          <p className="mt-2 text-xl font-semibold text-ink">{analysis.confidence}%</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Detected Entities
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {analysis.entities.length > 0 ? (
            analysis.entities.map((entity) => (
              <span
                key={entity}
                className="rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
              >
                {entity}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">No strong entities detected.</span>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          AI Summary
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-700">{analysis.summary}</p>
      </div>
    </div>
  );
}
