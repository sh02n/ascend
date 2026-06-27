import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { importBusinessSession } from "../../../../core/session-flow/session.api";
import { storeActiveBusinessSession } from "../../../../core/session-flow/businessSession";
import { BusinessProgressStepper } from "../../session/BusinessProgressStepper";
import { BusinessWorkflowTabs } from "../../session/BusinessWorkflowTabs";
import { ImportHeader } from "../components/import/ImportHeader";
import {
  cleanDataset,
  generateFieldMappings,
  parseDataset,
  profileDataset,
  rowsToCsv,
  type CleaningResult,
  type FieldMapping,
  type ParsedDataset,
} from "../utils/importProcessing";

const importSteps = ["Upload", "Profile", "Field Mapping", "Data Cleaning", "Preview", "Import Complete"] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function stepStatus(index: number, activeIndex: number) {
  if (index < activeIndex) return "complete" as const;
  if (index === activeIndex) return "active" as const;
  return "pending" as const;
}

export function ImportPage() {
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [cleaning, setCleaning] = useState<CleaningResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profile = dataset ? profileDataset(dataset, mappings) : null;
  const previewRows = cleaning?.cleanedRows ?? [];
  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    let rows = normalizedSearch
      ? previewRows.filter((row) => Object.values(row).some((value) => value.toLowerCase().includes(normalizedSearch)))
      : previewRows;

    if (sortColumn) {
      rows = [...rows].sort((left, right) => {
        const leftValue = left[sortColumn] ?? "";
        const rightValue = right[sortColumn] ?? "";
        return sortDirection === "asc" ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
      });
    }

    return rows;
  }, [previewRows, search, sortColumn, sortDirection]);
  const pageSize = 8;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  async function handleFile(file: File) {
    setError(null);
    const text = await file.text();
    const parsed = parseDataset(text, file);
    const nextMappings = generateFieldMappings(parsed.headers);
    const nextCleaning = cleanDataset(parsed, nextMappings);

    setDataset(parsed);
    setMappings(nextMappings);
    setCleaning(nextCleaning);
    setActiveStep(4);
    setSessionId(null);
    setPage(1);
  }

  function updateMapping(target: string, source: string) {
    const nextMappings = mappings.map((mapping) =>
      mapping.target === target ? { ...mapping, source, confidence: source ? Math.max(mapping.confidence, 72) : 0 } : mapping,
    );
    setMappings(nextMappings);
    if (dataset) setCleaning(cleanDataset(dataset, nextMappings));
  }

  async function confirmImport() {
    if (!dataset || !cleaning) return;

    setIsImporting(true);
    setError(null);

    try {
      const csv = rowsToCsv(dataset.headers, cleaning.cleanedRows);
      const file = new File([csv], "cleaned-investigation-dataset.csv", { type: "text/csv" });
      const response = await importBusinessSession(file);
      setSessionId(response.sessionId);
      storeActiveBusinessSession(response.sessionId);
      setActiveStep(5);
      navigate(`/detect/${response.sessionId}`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="space-y-6">
      <BusinessWorkflowTabs active="import" sessionId={sessionId} />
      <ImportHeader />
      <BusinessProgressStepper
        percent={(activeStep / (importSteps.length - 1)) * 100}
        detail={isImporting ? "Persisting cleaned dataset and creating session..." : "Data ingestion pipeline"}
        steps={importSteps.map((label, index) => ({ label, status: stepStatus(index, activeStep) }))}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Upload Dataset</h3>
            <p className="mt-1 text-sm text-slate-500">CSV data is profiled, mapped, cleaned, and previewed before import.</p>
          </div>
          <label className="inline-flex cursor-pointer rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
            Choose CSV
            <input
              className="hidden"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>
        </div>
        {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </section>

      {dataset && profile ? (
        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Automatic Dataset Profiling</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Rows", profile.rows],
                ["Columns", profile.columns],
                ["File Size", formatBytes(profile.fileSize)],
                ["Detected Delimiter", profile.detectedDelimiter],
                ["Encoding", profile.encoding],
                ["Date Range", profile.dateRange],
                ["Duplicate Rows", profile.duplicateRows],
                ["Missing Values", profile.missingValues],
                ["Invalid Records", profile.invalidRecords],
                ["Unique Buyers", profile.uniqueBuyers],
                ["Unique Sellers", profile.uniqueSellers],
                ["Unique Orders", profile.uniqueOrders],
                ["Unique Reviews", profile.uniqueReviews],
                ["Unique Refunds", profile.uniqueRefunds],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-1 font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Automatic Field Mapping</h3>
            <div className="mt-4 space-y-3">
              {mappings.map((mapping) => (
                <div key={mapping.target} className="grid gap-2 rounded-lg bg-slate-50 p-3 md:grid-cols-[150px_1fr_90px] md:items-center">
                  <p className="text-sm font-semibold text-slate-800">{mapping.target}</p>
                  <select
                    value={mapping.source}
                    onChange={(event) => updateMapping(mapping.target, event.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <option value="">Not mapped</option>
                    {dataset.headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  <span className="rounded-full bg-white px-3 py-1 text-center text-xs font-semibold text-slate-600">
                    {mapping.confidence}%
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {cleaning ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Data Cleaning</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {Object.entries(cleaning.summary).map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-semibold text-slate-950">{value}</p>
                <p className="mt-1 text-sm capitalize text-slate-500">{label.replace(/([A-Z])/g, " $1")}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {dataset && cleaning ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Preview Cleaned Dataset</h3>
              <p className="mt-1 text-sm text-slate-500">Search, sort, and review cleaned rows before importing.</p>
            </div>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search cleaned rows..."
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  {dataset.headers.map((header) => (
                    <th key={header} className="whitespace-nowrap px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSortColumn(header);
                          setSortDirection(sortColumn === header && sortDirection === "asc" ? "desc" : "asc");
                        }}
                      >
                        {header}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, rowIndex) => (
                  <tr key={`${page}-${rowIndex}`} className="border-b border-slate-100">
                    {dataset.headers.map((header) => {
                      const originalIndex = (page - 1) * pageSize + rowIndex;
                      const highlighted = cleaning.fixedCells.has(`${originalIndex}:${header}`);
                      return (
                        <td key={header} className={`whitespace-nowrap px-3 py-2 ${highlighted ? "bg-teal-50 text-teal-800" : "text-slate-700"}`}>
                          {row[header] || "n/a"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Page {page} of {pageCount}. Removed rows: {cleaning.removedRows.length}</p>
            <div className="flex gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-md border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Previous</button>
              <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-md border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Next</button>
              <button type="button" disabled={isImporting} onClick={() => void confirmImport()} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">
                {isImporting ? "Importing..." : "Import Dataset"}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
