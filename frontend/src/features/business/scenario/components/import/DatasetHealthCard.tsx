import type { ValidationReport } from "../../api/import.api";

type DatasetHealthCardProps = {
  report: ValidationReport;
};

type MetricProps = {
  label: string;
  value: string | number;
  tone?: "green" | "yellow" | "red";
};

function Metric({ label, value, tone = "green" }: MetricProps) {
  const toneClass = {
    green: "border-teal-200 bg-teal-50 text-teal-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${toneClass}`}>OK</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function scoreTone(score: number): "green" | "yellow" | "red" {
  if (score >= 90) {
    return "green";
  }
  if (score >= 70) {
    return "yellow";
  }
  return "red";
}

export function DatasetHealthCard({ report }: DatasetHealthCardProps) {
  const qualityTone = scoreTone(report.qualityScore);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Total Rows" value={report.totalRows.toLocaleString()} />
        <Metric label="Total Columns" value={report.totalColumns.toLocaleString()} />
        <Metric label="Missing Values" value={report.missingValues.toLocaleString()} tone={report.missingValues ? "yellow" : "green"} />
        <Metric label="Duplicate Rows" value={report.duplicateRows.toLocaleString()} tone={report.duplicateRows ? "yellow" : "green"} />
        <Metric label="Empty Cells" value={report.emptyCells.toLocaleString()} tone={report.emptyCells ? "yellow" : "green"} />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Dataset Quality Score</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold text-ink">{report.qualityScore}%</p>
            <span
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                qualityTone === "green"
                  ? "border-teal-200 bg-teal-50 text-teal-700"
                  : qualityTone === "yellow"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {report.qualityLabel}
            </span>
          </div>
        </div>
      </div>
      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        {report.summary}
      </p>
    </div>
  );
}
