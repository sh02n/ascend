import type { DatasetProfile } from "../../api/import.api";

type DatasetPreviewCardProps = {
  profile: DatasetProfile;
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

export function DatasetPreviewCard({ profile }: DatasetPreviewCardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Dataset name</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink">{profile.datasetName}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">File type</p>
          <p className="mt-1 text-sm font-semibold text-ink">{profile.fileType}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">File size</p>
          <p className="mt-1 text-sm font-semibold text-ink">{formatFileSize(profile.fileSize)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Rows</p>
          <p className="mt-1 text-sm font-semibold text-ink">{profile.rowCount.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Columns</p>
          <p className="mt-1 text-sm font-semibold text-ink">{profile.columnCount.toLocaleString()}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {profile.headers.map((header) => (
                <th key={header} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profile.previewRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {profile.headers.map((header) => (
                  <td key={header} className="max-w-64 truncate whitespace-nowrap px-4 py-3 text-slate-600">
                    {row[header] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
