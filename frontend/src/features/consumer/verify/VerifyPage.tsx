import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { incrementVerificationCount, startAnalysisTimer } from "../../../core/analytics/analytics";
import { verifyProduct } from "../api/consumer.api";
import { PageShell } from "../../../shared/components/PageShell";
const DEMO_SAMPLE_URL =
  import.meta.env.VITE_DEMO_SAMPLE_URL ?? "https://www.amazon.com/dp/B0C47Q1K8S";

export function VerifyPage() {
  const navigate = useNavigate();
  const [productUrl, setProductUrl] = useState(DEMO_SAMPLE_URL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await verifyProduct(productUrl.trim());
      incrementVerificationCount();
      startAnalysisTimer(response.sessionId);
      navigate(`/analysis/${encodeURIComponent(response.sessionId)}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to analyze this URL right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Verify"
      description="Paste a product link to get a fast trust read, plain-language verdict, and safer alternatives."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Consumer verification</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Check a listing before you buy</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              We reuse Ascend’s fraud engine to summarize seller trust, review authenticity, return risk, and unusual activity into one shopper-friendly report.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Product URL</span>
              <input
                type="url"
                required
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="https://www.amazon.com/dp/..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={isSubmitting || productUrl.trim().length === 0}
                className="inline-flex items-center justify-center rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? "Analyzing..." : "Analyze"}
              </button>
              <p className="text-xs leading-5 text-slate-500">
                Supported marketplaces: Amazon, Shopee, Lazada, eBay, and Etsy.
              </p>
            </div>
          </form>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f8fffd_0%,#ffffff_100%)] p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Session based</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Every check is persisted server-side</h3>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
            Verification creates an investigation session, runs detectors against a product-specific graph, and opens the analysis when complete.
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
