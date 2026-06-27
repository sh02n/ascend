import { useRef, useState } from "react";
import { importBusinessSession } from "../../../../../core/session-flow/session.api";

type DatasetUploadCardProps = {
  onSessionCreated: (sessionId: string) => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DatasetUploadCard({ onSessionCreated }: DatasetUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitFile(file: File) {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await importBusinessSession(file);
      onSessionCreated(response.sessionId);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Import failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Upload a CSV file to start a dynamic investigation session.");
      return;
    }

    setSelectedFile(file);
    void submitFile(file);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div
        className={`flex min-h-44 items-center justify-center rounded-lg border border-dashed px-6 text-center transition ${
          isDragging ? "border-teal-400 bg-teal-50" : "border-slate-300 bg-slate-50"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <div>
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-teal-700">
            CSV
          </div>
          <p className="mt-4 text-sm font-semibold text-ink">Upload investigation data</p>
          <p className="mt-1 text-xs text-slate-500">The session graph and detectors are built from this file.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => inputRef.current?.click()}
            >
              Choose CSV
            </button>
          </div>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Session Status</p>
        {selectedFile ? (
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <span className="inline-flex rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
              {isSubmitting ? "creating session" : "uploaded"}
            </span>
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No file selected yet.
          </div>
        )}
        {isSubmitting ? <p className="mt-4 text-xs text-slate-500">Creating investigation session...</p> : null}
        {error ? <p className="mt-4 text-xs font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
