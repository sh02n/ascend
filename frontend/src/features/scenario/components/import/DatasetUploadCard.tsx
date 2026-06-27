import { useRef, useState } from "react";
import {
  analyseImportedDataset,
  createImportSession,
  mapImportedDataset,
  profileImportedDataset,
  uploadDemoDataset,
  uploadImportFile,
  validateImportedDataset,
  type DatasetAnalysis,
  type DatasetProfile,
  type FieldMappingResult,
  type ImportUploadResponse,
  type ValidationReport,
} from "../../api/import.api";
import type { TransformationLogEntry } from "./TransformationLog";

type UploadedDataset = {
  filename: string;
  filesize: number;
  status: string;
};

type ImportPipelineResult = {
  upload: ImportUploadResponse["data"];
  profile: DatasetProfile;
  validation: ValidationReport;
  analysis: DatasetAnalysis;
  mapping: FieldMappingResult;
  log: TransformationLogEntry[];
};

type DatasetUploadCardProps = {
  onPipelineComplete: (result: ImportPipelineResult) => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timestamp() {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

export function DatasetUploadCard({ onPipelineComplete }: DatasetUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedDataset, setUploadedDataset] = useState<UploadedDataset | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runPipeline(uploadRequest: (sessionId: string) => Promise<ImportUploadResponse>) {
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await createImportSession();
      const upload = await uploadRequest(session.data.id);
      const profile = await profileImportedDataset(upload.data.id);
      const validation = await validateImportedDataset(upload.data.id);
      const analysis = await analyseImportedDataset(upload.data.id);
      const mapping = await mapImportedDataset(upload.data.id);

      setUploadedDataset({
        filename: upload.data.filename,
        filesize: upload.data.filesize,
        status: upload.data.status,
      });
      onPipelineComplete({
        upload: upload.data,
        profile: profile.data,
        validation: validation.data,
        analysis: analysis.data,
        mapping: mapping.data,
        log: [
          { label: "File uploaded", timestamp: timestamp() },
          { label: "CSV parsed", timestamp: timestamp() },
          { label: "Schema detected", timestamp: timestamp() },
          { label: "Dataset validated", timestamp: timestamp() },
          { label: "Dataset analysed", timestamp: timestamp() },
          { label: "Field mappings suggested", timestamp: timestamp() },
        ],
      });
    } catch (pipelineError) {
      setError(pipelineError instanceof Error ? pipelineError.message : "Import pipeline failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  function submitFile(file: File) {
    void runPipeline((sessionId) => uploadImportFile(sessionId, file));
  }

  function submitDemoDataset() {
    void runPipeline((sessionId) => uploadDemoDataset(sessionId));
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];

    if (!file) {
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".csv")) {
      setError("Phase 3 analysis supports CSV files only.");
      return;
    }

    submitFile(file);
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
            DS
          </div>
          <p className="mt-4 text-sm font-semibold text-ink">Drag and drop a dataset</p>
          <p className="mt-1 text-xs text-slate-500">CSV files are profiled, validated, and analysed.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => inputRef.current?.click()}
            >
              Choose CSV
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={submitDemoDataset}
            >
              Use Demo Dataset
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
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Upload Status
        </p>
        {uploadedDataset ? (
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink">{uploadedDataset.filename}</p>
              <p className="text-xs text-slate-500">{formatFileSize(uploadedDataset.filesize)}</p>
            </div>
            <span className="inline-flex rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
              {uploadedDataset.status}
            </span>
            <button
              type="button"
              className="block text-sm font-medium text-slate-600 hover:text-ink"
              onClick={() => setUploadedDataset(null)}
            >
              Remove uploaded file
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="h-3 rounded-full bg-slate-200" />
            <div className="h-3 w-5/6 rounded-full bg-slate-200" />
            <div className="h-3 w-2/3 rounded-full bg-slate-200" />
          </div>
        )}
        {isSubmitting ? <p className="mt-4 text-xs text-slate-500">Analysing dataset and mapping fields...</p> : null}
        {error ? <p className="mt-4 text-xs font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
