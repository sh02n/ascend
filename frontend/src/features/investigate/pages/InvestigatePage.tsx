import { PageShell } from "../../../shared/components/PageShell";
import { PlaceholderPanel } from "../../../components/ui/PlaceholderPanel";
import { EvidencePanel } from "../components/EvidencePanel";
import { Timeline } from "../components/Timeline";
import { Recommendation } from "../components/Recommendation";

export function InvestigatePage() {
  return (
    <PageShell
      title="Investigation"
      description="Evidence review, pattern checks, timelines, and AI explanation belong here."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <PlaceholderPanel title="Evidence" todo="TODO: load evidence snippets and references.">
          <EvidencePanel />
        </PlaceholderPanel>
        <PlaceholderPanel title="Timeline" todo="TODO: render activity sequences.">
          <Timeline />
        </PlaceholderPanel>
        <PlaceholderPanel title="Recommendation" todo="TODO: show disposition guidance.">
          <Recommendation />
        </PlaceholderPanel>
      </div>
    </PageShell>
  );
}
