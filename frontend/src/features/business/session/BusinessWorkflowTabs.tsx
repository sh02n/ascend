import { Link } from "react-router-dom";

type BusinessWorkflowTabsProps = {
  active: "import" | "fraud" | "investigation" | "dashboard";
  sessionId?: string | null;
};

const stages = [
  { id: "import", label: "Import", to: "/import" },
  { id: "fraud", label: "Fraud Detection", to: (sessionId: string) => `/detect/${sessionId}` },
  { id: "investigation", label: "Investigation", to: (sessionId: string) => `/investigate/${sessionId}` },
  { id: "dashboard", label: "Dashboard", to: (sessionId: string) => `/dashboard/${sessionId}` },
] as const;

export function BusinessWorkflowTabs({ active, sessionId }: BusinessWorkflowTabsProps) {
  return (
    <nav className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      <div className="flex min-w-max gap-1">
        {stages.map((stage) => {
          const isActive = stage.id === active;
          const isImport = stage.id === "import";
          const href = typeof stage.to === "string" ? stage.to : sessionId ? stage.to(sessionId) : null;
          const className = `rounded-md px-4 py-2 text-sm font-semibold transition ${
            isActive
              ? "bg-slate-950 text-white"
              : href
                ? "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                : "cursor-not-allowed text-slate-300"
          }`;

          if (!href && !isImport) {
            return (
              <span key={stage.id} className={className}>
                {stage.label}
              </span>
            );
          }

          return (
            <Link key={stage.id} to={href ?? "/import"} className={className}>
              {stage.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
