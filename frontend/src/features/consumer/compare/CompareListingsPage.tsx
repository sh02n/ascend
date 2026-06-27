import { useState, type FormEvent } from "react";
import { PageShell } from "../../../shared/components/PageShell";
import {
  compareConsumerListings,
  type ConsumerListingComparison,
  type ConsumerUrlScanResult,
} from "../api/consumer.api";

const SAMPLE_URL_A = import.meta.env.VITE_DEMO_SAMPLE_URL ?? "https://www.ebay.com/";
const SAMPLE_URL_B = "https://www.etsy.com/";

const progressSteps = ["Analyzing Listing A...", "Analyzing Listing B...", "Generating AI Comparison..."];

function riskTone(level: ConsumerUrlScanResult["riskLevel"]) {
  if (level === "High") return "border-rose-200 bg-rose-50 text-rose-700";
  if (level === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function scoreTone(level: ConsumerUrlScanResult["riskLevel"]) {
  if (level === "High") return "text-rose-700";
  if (level === "Medium") return "text-amber-700";
  return "text-emerald-700";
}

function ListingCard({ label, listing }: { label: "A" | "B"; listing: ConsumerUrlScanResult }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Listing {label}</p>
          <h3 className="mt-2 text-xl font-semibold leading-tight text-slate-950">{listing.title}</h3>
          <p className="mt-2 text-sm text-slate-500">{listing.domain}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskTone(listing.riskLevel)}`}>
          {listing.riskLevel} risk
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Risk Score</p>
          <p className={`mt-2 text-3xl font-semibold ${scoreTone(listing.riskLevel)}`}>{listing.riskScore}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Risk Level</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{listing.riskLevel}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Confidence</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{listing.confidence}%</p>
        </div>
      </div>

      <section className="mt-5">
        <h4 className="font-semibold text-slate-950">Summary</h4>
        <p className="mt-2 text-sm leading-6 text-slate-600">{listing.summary}</p>
      </section>

      <section className="mt-5">
        <h4 className="font-semibold text-slate-950">Evidence</h4>
        <ul className="mt-2 space-y-2">
          {listing.evidence.slice(0, 5).map((item) => (
            <li key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h4 className="font-semibold text-slate-950">Recommendation</h4>
        <p className="mt-2 text-sm leading-6 text-slate-600">{listing.recommendation}</p>
      </section>
    </article>
  );
}

export function CompareListingsPage() {
  const [urlA, setUrlA] = useState(SAMPLE_URL_A);
  const [urlB, setUrlB] = useState(SAMPLE_URL_B);
  const [result, setResult] = useState<ConsumerListingComparison | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setErrorMessage(null);
    setIsSubmitting(true);
    setProgressIndex(0);

    const timers = [
      window.setTimeout(() => setProgressIndex(1), 450),
      window.setTimeout(() => setProgressIndex(2), 900),
    ];

    try {
      const comparison = await compareConsumerListings(urlA.trim(), urlB.trim());
      setResult(comparison);
      setProgressIndex(2);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to compare these listings right now.");
    } finally {
      timers.forEach(window.clearTimeout);
      setIsSubmitting(false);
    }
  }

  const winnerListing = result?.comparison.winner === "A" ? result.listingA : result?.listingB;

  return (
    <PageShell
      title="Compare Listings"
      description="Compare two marketplace or product URLs side by side before deciding which one to trust."
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Ascendra comparison</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Compare Marketplace Listings</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Paste two public listing URLs. Ascendra scans each listing independently, then compares the finished risk reports.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Marketplace URL A</span>
            <input
              type="url"
              required
              value={urlA}
              onChange={(event) => setUrlA(event.target.value)}
              placeholder="https://example.com/listing-a"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Marketplace URL B</span>
            <input
              type="url"
              required
              value={urlB}
              onChange={(event) => setUrlB(event.target.value)}
              placeholder="https://example.com/listing-b"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !urlA.trim() || !urlB.trim()}
            className="inline-flex justify-center rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Comparing..." : "Compare Listings"}
          </button>
        </form>

        {errorMessage ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}
      </section>

      {isSubmitting ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-slate-950">{progressSteps[progressIndex]}</p>
              <p className="mt-1 text-sm text-slate-500">Scanning each listing and preparing the comparison.</p>
            </div>
            <p className="text-sm font-semibold text-teal-700">{Math.round(((progressIndex + 1) / progressSteps.length) * 100)}%</p>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-500"
              style={{ width: `${((progressIndex + 1) / progressSteps.length) * 100}%` }}
            />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {progressSteps.map((step, index) => (
              <div
                key={step}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  index <= progressIndex ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {result ? (
        <div className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-2">
            <ListingCard label="A" listing={result.listingA} />
            <ListingCard label="B" listing={result.listingB} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">AI Comparison</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">Which listing should I trust more?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{result.comparison.summary}</p>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {result.comparison.differences.map((difference) => (
                <li key={difference} className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                  {difference}
                </li>
              ))}
            </ul>
          </section>

          <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
            <div className="grid gap-4 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Safer Choice</p>
                <h3 className="mt-2 text-3xl font-semibold text-emerald-950">
                  🟢 Listing {result.comparison.winner}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-900">
                  {result.comparison.summary}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 px-5 py-4 text-right ring-1 ring-emerald-200">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Risk score</p>
                <p className={`mt-2 text-4xl font-semibold ${winnerListing ? scoreTone(winnerListing.riskLevel) : "text-emerald-700"}`}>
                  {winnerListing?.riskScore}
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
