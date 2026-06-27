export function CasePanel() {
  return (
    <div className="space-y-3">
      {[
        ["Case-104", "High review coordination confidence", "Open"],
        ["Case-071", "Refund spike requires analyst review", "Monitoring"],
      ].map(([caseId, summary, status]) => (
        <div key={caseId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">{caseId}</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{status}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{summary}</p>
        </div>
      ))}
    </div>
  );
}
