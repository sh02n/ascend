import { PageShell } from "../../../../shared/components/PageShell";
import { ReportView } from "../components/ReportView";

export function ReportPage() {
  return (
    <PageShell
      title="Report"
      description="Reporting output and case summaries are preserved within the business workspace."
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-950">Report View</h3>
          <p className="text-sm text-slate-500">Empty state included so the demo still lands cleanly when no report is selected.</p>
        </div>
        <ReportView />
      </section>
    </PageShell>
  );
}
