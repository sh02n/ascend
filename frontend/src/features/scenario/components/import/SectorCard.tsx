type SectorCardProps = {
  name: string;
  description: string;
  active?: boolean;
  disabled?: boolean;
};

export function SectorCard({ name, description, active = false, disabled = false }: SectorCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`min-h-32 rounded-lg border p-4 text-left transition ${
        active
          ? "border-teal-300 bg-teal-50 shadow-sm"
          : "border-slate-200 bg-slate-50 text-slate-500"
      } ${disabled ? "cursor-not-allowed opacity-70" : "hover:border-teal-300"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="h-8 w-8 rounded-md border border-slate-200 bg-white" />
        <span
          className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
            active
              ? "border-teal-200 bg-white text-teal-700"
              : "border-slate-200 bg-white text-slate-400"
          }`}
        >
          {active ? "Active" : "Coming Soon"}
        </span>
      </div>
      <h4 className="mt-4 text-sm font-semibold text-ink">{name}</h4>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </button>
  );
}
