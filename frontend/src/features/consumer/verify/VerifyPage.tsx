import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { incrementVerificationCount } from "../../../core/analytics/analytics";
import { PageShell } from "../../../shared/components/PageShell";
import { scanConsumerUrl, type ConsumerUrlScanResult } from "../api/consumer.api";

const SAMPLE_URL = import.meta.env.VITE_DEMO_SAMPLE_URL ?? "https://www.ebay.com/";

function riskTone(level: ConsumerUrlScanResult["riskLevel"]) {
  if (level === "High") return "bg-rose-100 text-rose-700 ring-rose-200";
  if (level === "Medium") return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-emerald-100 text-emerald-700 ring-emerald-200";
}

function scoreTone(score: number) {
  if (score >= 70) return "from-rose-600 to-red-700";
  if (score >= 40) return "from-amber-500 to-orange-600";
  return "from-emerald-600 to-teal-700";
}

export function VerifyPage() {
  const [url, setUrl] = useState(SAMPLE_URL);
  const [result, setResult] = useState<ConsumerUrlScanResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const scan = await scanConsumerUrl(url.trim());
      incrementVerificationCount();
      setResult(scan);
    } catch (error) {
      setResult(null);
      setErrorMessage(error instanceof Error ? error.message : "Unable to scan this URL right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Verify"
      description="Paste any public product or marketplace URL to scan for suspicious consumer-risk signals."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.78fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Ascendra URL scanner</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Check a listing before you buy</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ascendra fetches the pasted webpage, extracts visible seller, review, payment, and policy signals, then estimates consumer risk.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Public URL</span>
              <input
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/product/123"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
            </label>

            {errorMessage ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || url.trim().length === 0}
              className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Scanning webpage..." : "Scan URL"}
            </button>
          </form>
        </section>

        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">What Ascendra checks</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>Page title and description</p>
            <p>Seller, review, rating, price, payment, refund, and return language</p>
            <p>Suspicious phrases such as off-platform payments, urgency, no-refund claims, or crypto-only language</p>
          </div>
          <div className="mt-6 rounded-xl border border-teal-200 bg-white p-4">
            <p className="font-semibold text-slate-950">Choosing between two listings?</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Compare both URLs side by side and get Ascendra’s safer-choice recommendation.
            </p>
            <Link
              to="/compare"
              className="mt-4 inline-flex rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Compare listings
            </Link>
          </div>
        </aside>
      </div>

      {isSubmitting ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-teal-600" />
          </div>
          <p className="mt-4 text-sm text-slate-500">Fetching the webpage and extracting consumer-risk signals...</p>
        </section>
      ) : null}

      {result ? (
        <section className="space-y-6">
          <article className={`overflow-hidden rounded-xl bg-gradient-to-br ${scoreTone(result.riskScore)} text-white shadow-sm`}>
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_220px]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">{result.domain}</p>
                <h3 className="mt-3 text-2xl font-semibold">{result.title}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/85">{result.summary}</p>
                <p className="mt-4 text-sm text-white/75">Confidence: {result.confidence}%</p>
              </div>
              <div className="rounded-xl bg-white/15 p-5 ring-1 ring-white/20">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Risk score</p>
                <p className="mt-3 text-6xl font-semibold leading-none">{result.riskScore}</p>
                <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${riskTone(result.riskLevel)}`}>
                  {result.riskLevel} risk
                </span>
              </div>
            </div>
          </article>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">Evidence</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {result.evidence.map((item) => (
                  <article key={item} className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {item}
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">Suspicious signals</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.suspiciousSignals.length > 0 ? (
                  result.suspiciousSignals.map((signal) => (
                    <span key={signal} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                      {signal}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No listed suspicious phrases were found in the extracted content.</p>
                )}
              </div>
              <h4 className="mt-6 font-semibold text-slate-950">Recommendation</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">{result.recommendation}</p>
            </section>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Extracted webpage signals</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {Object.entries(result.extractedSignals).map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {label.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{value || "Not found"}</p>
                </div>
              ))}
            </div>
          </section>

          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Ascendra does not prove fraud. It highlights suspicious signals to help users make safer decisions.
          </p>
        </section>
      ) : null}
    </PageShell>
  );
}
