import { useState } from "react";
import { explainInvestigation } from "../api/investigate.api";
import type {
  AiInvestigationReport,
  InvestigationCluster,
  SuggestedQuestion,
} from "../../../../shared/types/investigation";

interface ChatMessage {
  id: string;
  role: "investigator" | "assistant";
  content: string;
  source?: "openai" | "fallback_mock";
}

interface InvestigatorChatProps {
  cluster: InvestigationCluster;
  investigation: AiInvestigationReport;
  questions: SuggestedQuestion[];
}

function getExplanationErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("empty response")) {
    return "The explanation service returned no answer. Please try again.";
  }

  return "We could not load that explanation right now. Please try again.";
}

export function InvestigatorChat({ cluster, investigation, questions }: InvestigatorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingQuestionId, setLoadingQuestionId] = useState<string | null>(null);

  async function askQuestion(question: SuggestedQuestion) {
    setLoadingQuestionId(question.id);

    setMessages((current) => [
      ...current,
      {
        id: `${question.id}-q-${current.length}`,
        role: "investigator",
        content: question.question,
      },
    ]);

    try {
      const response = await explainInvestigation({
        question: question.question,
        cluster,
        investigation,
      });

      setMessages((current) => [
        ...current,
        {
          id: `${question.id}-a-${current.length}`,
          role: "assistant",
          content: response.answer,
          source: response.source,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `${question.id}-error-${current.length}`,
          role: "assistant",
          content: getExplanationErrorMessage(error),
        },
      ]);
    } finally {
      setLoadingQuestionId(null);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Investigator Q&A</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Ask the AI explanation layer</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Investigator Response
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question.id}
            type="button"
            onClick={() => askQuestion(question)}
            disabled={loadingQuestionId !== null}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800"
          >
            {loadingQuestionId === question.id ? "Loading answer..." : question.question}
          </button>
        ))}
      </div>

      <div className="mt-5 min-h-40 rounded-md border border-slate-200 bg-slate-50 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">Select a suggested question to see a mock explanation.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {message.source ? (
                  <p className="mb-1 text-xs font-medium text-slate-500">
                    {message.source === "openai" ? "AI response" : "Fallback response"}
                  </p>
                ) : null}
                <div
                  className={`max-w-3xl rounded-lg px-4 py-3 text-sm leading-6 ${
                    message.role === "investigator"
                      ? "ml-auto bg-slate-900 text-white"
                      : "bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
