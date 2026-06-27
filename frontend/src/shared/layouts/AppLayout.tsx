import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { navigationLinksByRole } from "../../core/routing/routeConfig";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { getDefaultPathForRole } from "../../core/session/roleSession";
import { useState } from "react";

export function AppLayout() {
  const navigate = useNavigate();
  const { logout, updateRole, user } = useAuth();
  const role = user?.role ?? null;
  const links = role ? navigationLinksByRole[role] : [];
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function handleRoleSwitch(nextRole: "business" | "consumer") {
    setIsSwitchingRole(true);

    try {
      await updateRole(nextRole);
      navigate(getDefaultPathForRole(nextRole), { replace: true });
    } finally {
      setIsSwitchingRole(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.08),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eefbf7_100%)] text-ink">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                A
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-950">Ascend</h1>
                <p className="text-sm text-slate-500">Fraud intelligence for business teams and shoppers</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {role ? (
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                  {role}
                </span>
              ) : null}

              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition hover:border-teal-200">
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {user?.name?.slice(0, 1).toUpperCase() ?? "A"}
                  </div>
                </summary>
                <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{user?.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Experience</p>
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        disabled={isSwitchingRole || role === "business"}
                        onClick={() => void handleRoleSwitch("business")}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Business
                      </button>
                      <button
                        type="button"
                        disabled={isSwitchingRole || role === "consumer"}
                        onClick={() => void handleRoleSwitch("consumer")}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Consumer
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <NavLink
                      to="/onboarding"
                      className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Role selection
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-950"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
