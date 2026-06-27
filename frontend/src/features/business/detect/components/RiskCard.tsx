import type { RiskResult } from "../types";

interface RiskCardProps {
  risk?: RiskResult;
}

const labels: Array<[keyof RiskResult["breakdown"], string]> = [
  ["sharedResource", "Shared Resource"],
  ["reviewRing", "Review Ring"],
  ["refundAbuse", "Refund Abuse"],
  ["temporalBurst", "Temporal Burst"],
  ["denseCluster", "Dense Cluster"],
];

const levelTone: Record<RiskResult["level"], string> = {
  LOW: "text-[#36D6A0]",
  MEDIUM: "text-[#FFB454]",
  HIGH: "text-[#FF5C7A]",
};

const levelStroke: Record<RiskResult["level"], string> = {
  LOW: "#36D6A0",
  MEDIUM: "#FFB454",
  HIGH: "#FF5C7A",
};

const barTone: Record<keyof RiskResult["breakdown"], string> = {
  sharedResource: "bg-[#FF5C7A]",
  reviewRing: "bg-[#FF5C7A]",
  refundAbuse: "bg-[#FFB454]",
  temporalBurst: "bg-[#7C88AA]",
  denseCluster: "bg-[#7C88AA]",
};

export function RiskCard({ risk }: RiskCardProps) {
  if (!risk) {
    return (
      <section className="overflow-hidden rounded-[18px] border border-[#202A42] bg-gradient-to-b from-[#10162A] to-[#0B0F1B]">
        <div className="border-b border-[#161E30] px-5 py-4">
          <div className="h-5 w-36 animate-pulse rounded bg-[#161E36]" />
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-[200px_1fr]">
          <div className="mx-auto h-44 w-44 animate-pulse rounded-full bg-[#161E36]" />
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="h-7 animate-pulse rounded bg-[#161E36]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = Math.min(100, Math.max(0, risk.score));
  const dashArray = `${(scorePercent / 100) * circumference} ${circumference}`;
  const maxContribution = Math.max(...labels.map(([key]) => risk.breakdown[key]), 1);

  return (
    <section className="overflow-hidden rounded-[18px] border border-[#202A42] bg-gradient-to-b from-[#10162A] to-[#0B0F1B] shadow-[0_24px_70px_-44px_rgba(76,130,255,0.8)]">
      <div className="flex items-center justify-between gap-4 border-b border-[#161E30] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#EDEFF8]">Risk Overview</h2>
          <p className="mt-1 text-xs text-[#586383]">Composite score across 5 detectors</p>
        </div>
        <div className="rounded-lg border border-[#202A42] bg-[#161E36] px-3 py-2 text-[11px] font-semibold text-[#94A0BE]">
          Weighted
        </div>
      </div>

      <div className="grid gap-7 p-5 md:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative h-44 w-44">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#202A42" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={levelStroke[risk.level]}
                strokeDasharray={dashArray}
                strokeLinecap="round"
                strokeWidth="10"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold leading-none tracking-tight text-white">{risk.score}</span>
              <span className={`mt-1 text-[11px] font-bold tracking-[0.16em] ${levelTone[risk.level]}`}>
                {risk.level}
              </span>
            </div>
          </div>
          <p className="max-w-40 text-center text-xs text-[#586383]">
            {risk.score} of 100 possible risk points triggered
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-[#586383]">contribution per detector</span>
            <span className="font-mono text-xs text-[#94A0BE]">score</span>
          </div>
          {labels.map(([key, label]) => {
            const value = risk.breakdown[key];
            const width = `${(value / maxContribution) * 100}%`;

            return (
              <div key={key} className="flex items-center gap-3">
                <div className="flex w-32 shrink-0 items-center gap-2 text-xs text-[#94A0BE]">
                  <span className={`h-1.5 w-1.5 rounded-full ${barTone[key]}`} />
                  <span className="truncate">{label}</span>
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#161E36]">
                  <div className={`h-full rounded-full ${barTone[key]}`} style={{ width }} />
                </div>
                <span className="w-8 text-right font-mono text-xs text-[#EDEFF8]">{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
