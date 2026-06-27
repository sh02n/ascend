interface InvestigationSummaryProps {
  summary: string;
  generatedAt: string;
  reportId: string;
}

export function InvestigationSummary({ summary, generatedAt, reportId }: InvestigationSummaryProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Executive Summary</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">AI investigation report</h3>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{reportId}</p>
          <p>{new Date(generatedAt).toLocaleString()}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{summary}</p>
    </section>
  );
}
