import { PageShell } from "../../../shared/components/PageShell";
import { PlaceholderPanel } from "../../../components/ui/PlaceholderPanel";
import { ImportButton } from "../components/ImportButton";

export function ImportPage() {
  return (
    <PageShell
      title="Import Dataset"
      description="Scenario import flows stay isolated here for Person 1."
    >
      <PlaceholderPanel
        title="Dataset Import"
        todo="TODO: connect CSV or JSON dataset ingestion to the scenario API."
      >
        <ImportButton />
      </PlaceholderPanel>
    </PageShell>
  );
}
