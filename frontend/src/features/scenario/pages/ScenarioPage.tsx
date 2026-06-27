import { PageShell } from "../../../shared/components/PageShell";
import { PlaceholderPanel } from "../../../components/ui/PlaceholderPanel";
import { ScenarioCard } from "../components/ScenarioCard";

export function ScenarioPage() {
  return (
    <PageShell
      title="Scenario Setup"
      description="Dataset import, graph generation, and session setup live under the scenario feature."
    >
      <PlaceholderPanel
        title="Scenario Workspace"
        todo="TODO: build the scenario selection and session bootstrap flow."
      >
        <ScenarioCard />
      </PlaceholderPanel>
    </PageShell>
  );
}
