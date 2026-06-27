import { createReport } from "../api/dashboard.api";
import type { DetectionDetail, InvestigationReport } from "../types";

type ReportViewProps = {
  caseId: string;
  detections: DetectionDetail[];
  report: InvestigationReport;
};

export function ReportView({ caseId, detections, report }: ReportViewProps) {
  async function handleGeneratePacket() {
    await createReport({ caseId });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Investigation Report</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">{report.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{report.verdict}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleGeneratePacket()}
            className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 md:w-auto"
          >
            Generate Packet
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {report.sections.map((section) => (
          <article key={section.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-950">{section.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
            <ul className="mt-3 space-y-2">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {bullet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-950">Evidence Matrix</h4>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Signal</th>
                  <th className="px-3 py-2">Confidence</th>
                  <th className="px-3 py-2">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {detections.map((detection) => (
                  <tr key={detection.key}>
                    <td className="px-3 py-3 font-medium text-slate-950">{detection.label}</td>
                    <td className="px-3 py-3 text-slate-700">{Math.round(detection.confidence * 100)}%</td>
                    <td className="px-3 py-3 text-slate-600">{detection.evidence.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-950">Action Recommender</h4>
          <div className="mt-3 space-y-2">
            {report.recommendations.map((recommendation) => (
              <p key={recommendation} className="rounded-md border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-950">
                {recommendation}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
