import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/scenario", label: "Scenario" },
  { to: "/detect", label: "Detect" },
  { to: "/investigate", label: "Investigate" },
  { to: "/dashboard", label: "Dashboard" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Ascend</h1>
            <p className="text-sm text-slate-500">Feature-first hackathon scaffold</p>
          </div>
          <nav className="flex gap-3">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
