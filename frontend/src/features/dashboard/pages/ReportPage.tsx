import { PageShell } from "../../../shared/components/PageShell";
import { PlaceholderPanel } from "../../../components/ui/PlaceholderPanel";
import { ReportView } from "../components/ReportView";

export function ReportPage() {
  return (
    <PageShell
      title="Report"
      description="Reporting output and case summaries belong to the dashboard feature."
    >
      <PlaceholderPanel title="Report View" todo="TODO: render generated report content.">
        <ReportView />
      </PlaceholderPanel>
    </PageShell>
  );
}
