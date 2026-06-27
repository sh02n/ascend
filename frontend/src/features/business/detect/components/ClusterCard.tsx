import type { ClusterSummary } from "../types";

interface ClusterCardProps {
  cluster: ClusterSummary;
  selected: boolean;
  onSelect: (clusterId: string) => void;
}

const levelStyles: Record<ClusterSummary["level"], string> = {
  LOW: "border-[#36D6A0]/50 bg-[#36D6A0]/15 text-[#36D6A0]",
  MEDIUM: "border-[#FFB454]/50 bg-[#FFB454]/15 text-[#FFB454]",
  HIGH: "border-[#FF5C7A]/50 bg-[#FF5C7A]/15 text-[#FF5C7A]",
};

const levelText: Record<ClusterSummary["level"], string> = {
  LOW: "text-[#36D6A0]",
  MEDIUM: "text-[#FFB454]",
  HIGH: "text-[#FF5C7A]",
};

export function ClusterCard({ cluster, selected, onSelect }: ClusterCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cluster.id)}
      className={`group flex w-full items-center gap-3 rounded-[14px] border p-3 text-left transition duration-150 ${
        selected
          ? "border-[#4C82FF]/60 bg-[linear-gradient(135deg,rgba(76,130,255,.16),#10162A)] shadow-[0_16px_34px_-22px_rgba(76,130,255,.9)] ring-1 ring-[#4C82FF]/50"
          : "border-[#202A42] bg-[#10162A] hover:translate-x-0.5 hover:border-[#4C82FF]/50"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${levelStyles[cluster.level]}`}
      >
        {cluster.score}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[12px] font-medium text-[#EDEFF8]">{cluster.id}</p>
        <p className={`mt-1 text-[10px] font-bold tracking-[0.16em] ${levelText[cluster.level]}`}>
          {cluster.level} RISK
        </p>
      </div>
      <svg
        className={`h-4 w-4 shrink-0 text-[#586383] transition ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
