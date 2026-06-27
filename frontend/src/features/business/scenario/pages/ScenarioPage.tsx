import { Link } from "react-router-dom";
import { PageShell } from "../../../../shared/components/PageShell";

export function ScenarioPage() {
  return (
    <PageShell
      title="Scenario Setup"
      description="Dataset import, graph generation, and session setup now anchor the business experience."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Business workflow</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Start with imported data, then move through detection and investigation</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            This workspace sets up a business investigation session. Import marketplace data, inspect detector output, then move into investigation and dashboard review.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["1", "Import source data", "Upload a CSV and create the investigation session graph."],
              ["2", "Run detection", "Open clustered signals, graph evidence, and detector reasoning with the shared fraud engine."],
              ["3", "Review outcomes", "Continue through investigation and the dashboard to close the session."],
            ].map(([step, title, description]) => (
              <article key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step {step}</p>
                <h4 className="mt-2 text-lg font-semibold text-slate-950">{title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/import" className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800">
              Open import
            </Link>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Current journey</p>
          <div className="mt-5 space-y-3">
            {[
              "Scenario",
              "Import",
              "Detect",
              "Investigate",
              "Dashboard",
            ].map((item, index) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item}</p>
                  <p className="text-xs leading-5 text-slate-500">
                    {item === "Scenario" ? "Shared entry point for the business experience." : `Available in the shared top navigation.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
