export type TransformationLogEntry = {
  label: string;
  timestamp: string;
};

type TransformationLogProps = {
  entries: TransformationLogEntry[];
};

export function TransformationLog({ entries }: TransformationLogProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={`${entry.label}-${entry.timestamp}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white">
                ?
              </span>
              <span className="text-sm font-medium text-ink">{entry.label}</span>
            </div>
            <time className="shrink-0 text-xs text-slate-500">{entry.timestamp}</time>
          </div>
        ))}
      </div>
    </div>
  );
}

