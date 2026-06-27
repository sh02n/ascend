export function ImportHeader() {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Dataset Import
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Import Investigation Dataset
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Import, analyse and prepare datasets for AI-powered fraud investigation.
        </p>
      </div>

      <div className="w-full rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 shadow-sm sm:w-auto sm:min-w-64 sm:text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Dynamic Session
        </p>
        <p className="mt-1 text-xs text-slate-600">CSV source required</p>
      </div>
    </div>
  );
}
