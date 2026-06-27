import { Link, useParams } from "react-router-dom";
import { useConsumerAnalysis } from "../hooks/useConsumerAnalysis";
import { PageShell } from "../../../shared/components/PageShell";
import type { ConsumerAnalysis, ConsumerSignal, ConsumerSignalId } from "../types";

const signalLabels: Record<ConsumerSignalId, string> = {
  sellerTrust: "Seller reliability",
  reviewAuthenticity: "Review quality",
  returnRisk: "Return/refund risk",
  promotionManipulation: "Unusual activity",
  coordinatedActivity: "Coordinated fake behavior",
};

const normalCopy: Record<ConsumerSignalId, string> = {
  sellerTrust: "The seller pattern looks steady for this listing.",
  reviewAuthenticity: "The review pattern does not show obvious manipulation.",
  returnRisk: "Return and refund signals look within a normal range.",
  promotionManipulation: "Listing activity does not show unusual spikes.",
  coordinatedActivity: "The listing does not show strong signs of coordinated fake behavior.",
};

const concernCopy: Record<ConsumerSignalId, string> = {
  sellerTrust: "Check the seller profile and recent ratings before buying.",
  reviewAuthenticity: "Read recent reviews carefully, especially short or repetitive ones.",
  returnRisk: "Review the return policy and recent buyer complaints.",
  promotionManipulation: "Look for sudden review spikes or unusually aggressive promotion.",
  coordinatedActivity: "Compare with more established sellers if anything feels off.",
};

function scoreTone(score: number) {
  if (score >= 80) return "from-emerald-600 to-teal-700";
  if (score >= 60) return "from-amber-500 to-orange-600";
  return "from-rose-600 to-red-700";
}

function adviceForTrust(level: ConsumerAnalysis["trust"]["level"]) {
  if (level === "Likely Genuine") {
    return "Safe to proceed, but compare seller ratings and recent reviews.";
  }

  if (level === "Mixed") {
    return "Proceed carefully. Check recent 1-star reviews and seller profile.";
  }

  return "Avoid this listing or choose a more established seller.";
}

function signalConcern(signal: ConsumerSignal, trustScore: number) {
  if (signal.status === "clear") {
    return {
      label: "Looks normal",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      copy: normalCopy[signal.id],
    };
  }

  const isStrongConcern = signal.scoreImpact >= 35 && !(trustScore >= 80 && signal.scoreImpact < 50);

  return {
    label: isStrongConcern ? "Strong concern" : "Minor concern",
    className: isStrongConcern ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200",
    copy: concernCopy[signal.id],
  };
}

function takeawayForSignal(signal: ConsumerSignal, trustScore: number) {
  const concern = signalConcern(signal, trustScore);

  if (concern.label === "Looks normal") {
    return `${signalLabels[signal.id]} looks normal.`;
  }

  return `${signalLabels[signal.id]} has a ${concern.label.toLowerCase()}. ${concern.copy}`;
}

export function AnalysisPage() {
  const { sessionId } = useParams();
  const analysisId = sessionId ?? null;
  const { analysis, errorMessage, isLoading } = useConsumerAnalysis(analysisId);

  if (!analysisId) {
    return (
      <PageShell title="Analysis" description="Open an analysis from Verify.">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-600 shadow-sm">
          No analysis selected yet. Start from <Link to="/verify" className="font-semibold text-teal-700">Verify</Link>.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Trust Check"
      description="A buyer-friendly read on whether this listing looks safe to buy."
    >
      {errorMessage ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errorMessage}
        </div>
      ) : null}

      {isLoading && !analysis ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-600 shadow-sm">
          Checking this listing...
        </div>
      ) : null}

      {analysis ? (
        <div className="space-y-6">
          <section className={`overflow-hidden rounded-xl bg-gradient-to-br ${scoreTone(analysis.trust.score)} text-white shadow-sm`}>
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_260px] lg:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                  {analysis.product.marketplace}
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight">Can I trust this listing?</h3>
                <p className="mt-3 max-w-3xl text-base leading-7 text-white/85">{analysis.verdict}</p>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">
                  {analysis.product.title ?? "This listing"} was checked for seller reliability, review quality, return risk, and unusual activity.
                </p>

                <div className="mt-6 flex flex-wrap gap-2 text-sm text-white/85">
                  {analysis.product.seller ? <span className="rounded-full bg-white/15 px-3 py-1">Seller: {analysis.product.seller}</span> : null}
                  {analysis.product.rating ? <span className="rounded-full bg-white/15 px-3 py-1">Rating: {analysis.product.rating}/5</span> : null}
                  {analysis.product.reviewCount ? <span className="rounded-full bg-white/15 px-3 py-1">{analysis.product.reviewCount} reviews</span> : null}
                </div>
              </div>

              <div className="rounded-xl bg-white/14 p-5 ring-1 ring-white/20">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Trust score</p>
                <p className="mt-3 text-6xl font-semibold leading-none">{analysis.trust.score}</p>
                <p className="mt-2 text-sm font-semibold text-white">{analysis.trust.level}</p>
                <Link
                  to={`/insights/${encodeURIComponent(analysis.analysisId)}`}
                  className="mt-6 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
                >
                  View detailed insights
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Key Takeaways</h3>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {analysis.signals.slice(0, 5).map((signal) => (
                <li key={signal.id} className="rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                  {takeawayForSignal(signal, analysis.trust.score)}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analysis.signals.map((signal) => {
              const concern = signalConcern(signal, analysis.trust.score);

              return (
                <article key={signal.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-lg font-semibold text-slate-950">{signalLabels[signal.id]}</h4>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${concern.className}`}>
                      {concern.label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{concern.copy}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Signal strength: {signal.scoreImpact}</span>
                    <span>Confidence: {Math.round(signal.confidence * 100)}%</span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">Buyer Advice</h3>
              <p className="mt-3 text-base leading-7 text-slate-700">{adviceForTrust(analysis.trust.level)}</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-950">Confidence Note</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This is an automated trust estimate based on available listing and review signals, not a guarantee.
              </p>
            </article>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
