import { PageShell } from "../../../shared/components/PageShell";
import { ReportView } from "../components/ReportView";
import { useDashboard } from "../hooks/useDashboard";

export function ReportPage() {
  const dashboard = useDashboard();

  if (dashboard.status === "loading") {
    return (
      <PageShell title="Report" description="Preparing the investigation packet.">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading report...
        </div>
      </PageShell>
    );
  }

  if (dashboard.status === "error") {
    return (
      <PageShell title="Report" description="The investigation packet could not load.">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {dashboard.error}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Report" description="Investigation packet for the Fake Review Ring cluster.">
      <ReportView
        caseId={dashboard.data.case.id}
        detections={dashboard.data.detections}
        report={dashboard.data.report}
      />
    </PageShell>
  );
}
