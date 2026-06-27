import { useState } from "react";
import { updateCase } from "../api/dashboard.api";
import type { CaseSummary, TimelineEvent } from "../types";

type CasePanelProps = {
  caseSummary?: CaseSummary;
  timeline?: TimelineEvent[];
};

const statuses = ["Escalated", "Under Review", "Evidence Hold", "Closed"] as const;

const fallbackCase: CaseSummary = {
  id: "case_cluster_001",
  status: "Escalated",
  owner: "Marketplace Trust",
  priority: "High",
  notes: ["Loading case evidence..."],
  updatedAt: new Date().toISOString(),
};

export function CasePanel({ caseSummary = fallbackCase, timeline = [] }: CasePanelProps) {
  const [currentCase, setCurrentCase] = useState(caseSummary);
  const [draftNote, setDraftNote] = useState("");

  async function handleStatusChange(status: string) {
    const updated = await updateCase(currentCase.id, { status });
    setCurrentCase((existing) => ({ ...existing, ...updated }));
  }

  async function handleAddNote() {
    const nextNote = draftNote.trim();

    if (!nextNote) {
      return;
    }

    const updated = await updateCase(currentCase.id, {
      notes: [nextNote, ...currentCase.notes],
    });

    setCurrentCase((existing) => ({ ...existing, ...updated }));
    setDraftNote("");
  }

  return (
    <aside className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Case Tracking</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">{currentCase.id}</h3>
          </div>
          <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            {currentCase.priority}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Owner</dt>
            <dd className="font-medium text-slate-950">{currentCase.owner}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Updated</dt>
            <dd className="font-medium text-slate-950">
              {new Date(currentCase.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </dd>
          </div>
        </dl>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="case-status">
          Case Status
        </label>
        <select
          id="case-status"
          value={currentCase.status}
          onChange={(event) => void handleStatusChange(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none ring-teal-600 focus:ring-2"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
        <div className="mt-3 flex gap-2">
          <input
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
            placeholder="Add investigator note"
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
          />
          <button
            type="button"
            onClick={() => void handleAddNote()}
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Add
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {currentCase.notes.map((note) => (
            <p key={note} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {note}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Event Timeline</p>
        <ol className="mt-3 space-y-3">
          {timeline.map((item) => (
            <li key={`${item.time}-${item.event}`} className="grid grid-cols-[48px_1fr] gap-3 text-sm">
              <span className="font-semibold text-teal-700">{item.time}</span>
              <span className="text-slate-700">{item.event}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
