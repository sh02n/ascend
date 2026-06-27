import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../../../shared/components/PageShell";
import { getSessionAnalysis, investigateSession, type SessionInvestigation } from "../../../core/session-flow/session.api";
import { storeActiveBusinessSession } from "../../../core/session-flow/businessSession";
import { BusinessWorkflowTabs } from "../session/BusinessWorkflowTabs";
import { BusinessProgressStepper } from "../session/BusinessProgressStepper";

const investigationSteps = ["Evidence", "Timeline", "AI Analysis", "Executive Summary", "Dashboard Ready"];
const progressMessages = [
  "Analysing graph relationships...",
  "Generating fraud pattern...",
  "Building executive summary...",
  "Preparing recommendations...",
];
const suggestedPrompts = [
  "Why is this seller suspicious?",
  "Summarise this investigation.",
  "Show strongest evidence.",
  "Explain review manipulation.",
  "Could this be a false positive?",
];

function priorityTone(priority: string) {
  if (priority === "HIGH" || priority === "CRITICAL") return "bg-rose-100 text-rose-700";
  if (priority === "MEDIUM") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function answerQuestion(question: string, report: SessionInvestigation) {
  const lower = question.toLowerCase();
  if (lower.includes("false positive")) {
    return report.falsePositive.map((item) => `${item.consideration}: ${item.assessment}`).join(" ");
  }
  if (lower.includes("strongest") || lower.includes("evidence")) {
    return report.evidence.slice(0, 3).map((item) => `${item.label}: ${item.detail}`).join(" ");
  }
  if (lower.includes("review")) {
    return report.evidence.find((item) => item.label.toLowerCase().includes("review"))?.detail ?? report.pattern.description;
  }
  if (lower.includes("why")) {
    return `${report.pattern.description} Recommended action: ${report.recommendation.action}.`;
  }
  return `${report.pattern.title}. ${report.recommendation.rationale}`;
}

export function Investigate() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<SessionInvestigation | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(sessionId));
  const [progress, setProgress] = useState(10);
  const [progressMessage, setProgressMessage] = useState(progressMessages[0]);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<Array<{ question: string; answer: string }>>([]);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const activeSessionId = sessionId;
    storeActiveBusinessSession(activeSessionId);

    async function loadInvestigation() {
      setIsLoading(true);
      setError(null);
      setProgress(20);
      setProgressMessage(progressMessages[0]);

      try {
        const existing = await getSessionAnalysis(activeSessionId);
        setProgress(45);
        setProgressMessage(progressMessages[1]);
        const nextReport = existing.investigation ?? (await investigateSession(activeSessionId));
        setProgress(78);
        setProgressMessage(progressMessages[2]);

        if (!cancelled) {
          setReport(nextReport);
          setProgress(100);
          setProgressMessage(progressMessages[3]);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to generate investigation");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadInvestigation();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <PageShell title="Investigation Analysis" description="Run detection before opening an investigation.">
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          No session selected. Start from <Link className="font-semibold text-teal-700" to="/import">Import</Link>.
        </div>
      </PageShell>
    );
  }

  function ask(nextQuestion: string) {
    if (!report || !nextQuestion.trim()) return;
    setChat((current) => [...current, { question: nextQuestion, answer: answerQuestion(nextQuestion, report) }]);
    setQuestion("");
  }

  return (
    <PageShell title="Investigation Analysis" description="AI-assisted investigation workspace for this session.">
      <BusinessWorkflowTabs active="investigation" sessionId={sessionId} />
      <BusinessProgressStepper
        percent={progress}
        detail={isLoading ? progressMessage : "Executive summary ready"}
        steps={investigationSteps.map((label, index) => ({
          label,
          status: progress >= ((index + 1) / investigationSteps.length) * 100 ? "complete" : progress >= (index / investigationSteps.length) * 100 ? "active" : "pending",
          to: index === 0 ? `/detect/${sessionId}` : undefined,
        }))}
      />

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div> : null}

      {isLoading && !report ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">{progressMessage}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {report ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">AI Executive Summary</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{report.pattern.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{report.pattern.description}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Most suspicious behaviour</p><p className="font-semibold text-slate-900">{report.pattern.indicators[0] ?? "No dominant pattern"}</p></div>
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Confidence</p><p className="font-semibold text-slate-900">{report.pattern.confidence}%</p></div>
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Recommended action</p><p className="font-semibold text-slate-900">{report.recommendation.action}</p></div>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(report.recommendation.priority)}`}>
                {report.recommendation.priority}
              </span>
            </div>
          </section>

          <details className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-lg font-semibold text-slate-950">Timeline</summary>
            <div className="mt-4 space-y-3">
              {report.timeline.map((event) => (
                <article key={event.id} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{event.timestamp}</p>
                  <p className="mt-1 font-semibold text-slate-950">{event.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{event.description}</p>
                </article>
              ))}
            </div>
          </details>

          <details className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-lg font-semibold text-slate-950">Evidence</summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {report.evidence.map((item) => (
                <article key={item.id} className="rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(item.severity)}`}>{item.severity}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.source}</p>
                </article>
              ))}
            </div>
          </details>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-950">AI Question Assistant</h3>
              <button type="button" onClick={() => setIsChatOpen((value) => !value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold">
                {isChatOpen ? "Collapse history" : "Expand history"}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => ask(prompt)} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-teal-50">
                  {prompt}
                </button>
              ))}
            </div>
            {isChatOpen ? (
              <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-4">
                {chat.length === 0 ? <p className="text-sm text-slate-500">Ask a question about this investigation.</p> : null}
                {chat.map((item, index) => (
                  <div key={`${item.question}-${index}`} className="space-y-2">
                    <p className="font-semibold text-slate-900">{item.question}</p>
                    <p className="text-sm leading-6 text-slate-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex gap-2">
              <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about evidence, risk, or false positives..." className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm" />
              <button type="button" onClick={() => ask(question)} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Ask</button>
            </div>
          </section>

          <div className="flex justify-end">
            <button type="button" onClick={() => navigate(`/dashboard/${sessionId}`)} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
              Generate Dashboard
            </button>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
