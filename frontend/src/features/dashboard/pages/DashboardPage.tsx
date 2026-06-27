import { PageShell } from "../../../shared/components/PageShell";
import { PlaceholderPanel } from "../../../components/ui/PlaceholderPanel";
import { GraphCanvas } from "../components/GraphCanvas";
import { CasePanel } from "../components/CasePanel";

export function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="Graph visualization, case tracking, and reporting are isolated in the dashboard feature."
    >
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <PlaceholderPanel title="Graph Canvas" todo="TODO: mount Cytoscape.js graph view.">
          <GraphCanvas />
        </PlaceholderPanel>
        <PlaceholderPanel title="Case Panel" todo="TODO: list active cases and statuses.">
          <CasePanel />
        </PlaceholderPanel>
      </div>
    </PageShell>
  );
}
