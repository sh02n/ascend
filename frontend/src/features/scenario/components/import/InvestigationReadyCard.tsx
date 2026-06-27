import { useState } from "react";
import {
  transformImportedDataset,
  type DatasetAnalysis,
  type DatasetProfile,
  type FieldMappingResult,
  type InvestigationDatasetResult,
  type ValidationReport,
} from "../../api/import.api";

type InvestigationReadyCardProps = {
  sessionId: string;
  profile: DatasetProfile;
  validation: ValidationReport;
  analysis: DatasetAnalysis;
  mapping: FieldMappingResult;
  onGenerated: (dataset: InvestigationDatasetResult) => void;
};

function downloadCsv(result: InvestigationDatasetResult) {
  const blob = new Blob([result.export.csvContent], { type: result.export.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.export.filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function InvestigationReadyCard({
  sessionId,
  profile,
  validation,
  analysis,
  mapping,
  onGenerated,
}: InvestigationReadyCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvestigationDatasetResult | null>(null);

  async function generateInvestigationDataset() {
    setError(null);
    setIsGenerating(true);

    try {
      const response = await transformImportedDataset(sessionId, profile.datasetId);
      setResult(response.data);
      onGenerated(response.data);
    } catch (transformError) {
      setError(transformError instanceof Error ? transformError.message : "Transformation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-teal-200 bg-teal-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-800">Ready for Investigation</p>
          <p className="mt-1 text-xs text-teal-700">
            Validation, analysis, and field mapping are complete.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isGenerating}
          onClick={() => void generateInvestigationDataset()}
        >
          {isGenerating ? "Generating..." : "Generate Investigation Dataset"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Dataset Name</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink">{profile.datasetName}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Rows</p>
          <p className="mt-1 text-sm font-semibold text-ink">{profile.rowCount.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Columns</p>
          <p className="mt-1 text-sm font-semibold text-ink">{profile.columnCount.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Validation Status</p>
          <p className="mt-1 text-sm font-semibold text-ink">Completed</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Quality Score</p>
          <p className="mt-1 text-sm font-semibold text-ink">{validation.qualityScore}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Detected Dataset Type</p>
          <p className="mt-1 text-sm font-semibold text-ink">{analysis.detectedDatasetType}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Analysis Confidence</p>
          <p className="mt-1 text-sm font-semibold text-ink">{analysis.confidence}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Mapped Fields</p>
          <p className="mt-1 text-sm font-semibold text-ink">{mapping.mappings.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Transformation Status</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {result ? "Generated" : "Pending generation"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Output Format</p>
          <p className="mt-1 text-sm font-semibold text-ink">JSON + CSV</p>
        </div>
      </div>

      {result ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Transformation Summary</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <span>Done: Dataset uploaded</span>
                <span>Done: CSV parsed</span>
                <span>Done: Validation completed</span>
                <span>Done: Dataset analysed</span>
                <span>Done: Fields mapped</span>
                <span>Done: Investigation dataset generated</span>
              </div>
            </div>
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => downloadCsv(result)}
            >
              Export CSV
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            {result.recordCount.toLocaleString()} records generated with {result.mappedFields.length} mapped fields.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

