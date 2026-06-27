import { PageShell } from "../../../shared/components/PageShell";
import { PlaceholderPanel } from "../../../components/ui/PlaceholderPanel";
import { RiskCard } from "../components/RiskCard";
import { SignalList } from "../components/SignalList";
import { ClusterList } from "../components/ClusterList";

export function DetectPage() {
  return (
    <PageShell
      title="Detection"
      description="Cluster analysis, signals, and risk review live under the detect feature."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <PlaceholderPanel title="Risk" todo="TODO: surface risk score summaries.">
          <RiskCard />
        </PlaceholderPanel>
        <PlaceholderPanel title="Signals" todo="TODO: list suspicious signals by entity.">
          <SignalList />
        </PlaceholderPanel>
        <PlaceholderPanel title="Clusters" todo="TODO: review detected clusters and bursts.">
          <ClusterList />
        </PlaceholderPanel>
      </div>
    </PageShell>
  );
}
