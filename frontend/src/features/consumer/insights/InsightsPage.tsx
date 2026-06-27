import { Link, useParams } from "react-router-dom";
import { useConsumerAnalysis } from "../hooks/useConsumerAnalysis";
import { PageShell } from "../../../shared/components/PageShell";

export function InsightsPage() {
  const { sessionId } = useParams();
  const analysisId = sessionId ?? null;
  const { analysis, errorMessage, isLoading } = useConsumerAnalysis(analysisId);

  if (!analysisId) {
    return (
      <PageShell title="Insights" description="Open a consumer analysis first to see the deeper explanation.">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-600 shadow-sm">
          No analysis selected yet. Start from <Link to="/verify" className="font-semibold text-teal-700">Verify</Link>.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Insights"
      description="See the deeper reasoning behind the verdict and compare safer dataset-based alternatives."
    >
      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errorMessage}
        </div>
      ) : null}

      {isLoading && !analysis ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-600 shadow-sm">
          Loading deeper insights...
        </div>
      ) : null}

      {analysis ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Deep explanation</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">{analysis.product.title ?? "Untitled listing"}</h3>
                </div>
                <Link
                  to={`/analysis/${encodeURIComponent(analysis.analysisId)}`}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                >
                  Back to summary
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                {analysis.insights.map((insight) => (
                  <details
                    key={insight.id}
                    open={insight.id === "overall-read"}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <summary className="cursor-pointer list-none">
                      <p className="text-base font-semibold text-slate-950">{insight.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{insight.summary}</p>
                    </summary>
                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                      {insight.details.map((detail) => (
                        <p key={detail} className="text-sm leading-6 text-slate-600">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Expandable signal details</p>
              <div className="mt-5 space-y-3">
                {analysis.signals.map((signal) => (
                  <details key={signal.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold text-slate-950">{signal.title}</p>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {signal.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{signal.summary}</p>
                    </summary>
                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                      {signal.details.map((detail) => (
                        <p key={detail} className="text-sm leading-6 text-slate-600">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Alternatives</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">Three stronger options from the dataset</h3>
            <div className="mt-6 space-y-4">
              {analysis.alternatives.map((alternative, index) => (
                <article key={`${alternative.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Option {index + 1}</p>
                  <h4 className="mt-2 text-lg font-semibold text-slate-950">{alternative.title}</h4>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{alternative.reason}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </PageShell>
  );
}
