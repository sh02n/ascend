import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { getDefaultPathForRole } from "../session/roleSession";
import type { ProductRole } from "./roles";

const businessPaths = ["/scenario", "/import", "/detect", "/investigate", "/dashboard"];
const consumerPaths = ["/verify", "/analysis", "/insights"];

const roleCards: Array<{
  role: ProductRole;
  title: string;
  description: string;
  nextStep: string;
}> = [
  {
    role: "business",
    title: "Business Experience",
    description: "Continue through scenario setup, detection, investigation, and dashboard operations.",
    nextStep: "Continue to /scenario",
  },
  {
    role: "consumer",
    title: "Consumer Experience",
    description: "Paste a product URL, review a lightweight trust analysis, and explore safer alternatives.",
    nextStep: "Continue to /verify",
  },
];

export function RoleOnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateRole, user } = useAuth();
  const currentRole = user?.role ?? null;
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestedPath = useMemo(() => {
    const state = location.state as { from?: string } | null;

    return state?.from;
  }, [location.state]);
  const reason = useMemo(() => {
    const state = location.state as { reason?: string } | null;

    return state?.reason ?? null;
  }, [location.state]);

  async function selectRole(role: ProductRole) {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateRole(role);
      const canResumeRequestedPath =
        requestedPath !== undefined &&
        ((role === "business" && businessPaths.includes(requestedPath)) ||
          (role === "consumer" && consumerPaths.includes(requestedPath)));

      navigate(canResumeRequestedPath ? requestedPath : getDefaultPathForRole(role), { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save your role right now.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Onboarding</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Choose your role once</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Ascend stores your role in local storage and automatically routes you back into the matching product flow.
          </p>
          {currentRole ? (
            <p className="mt-3 text-sm font-medium text-slate-500">
              Current role: <span className="capitalize text-slate-800">{currentRole}</span>
            </p>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {reason === "missing-role" ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Choose an experience to continue. Your session is active, but no role is attached yet.
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {roleCards.map((card) => (
            <button
              key={card.role}
              type="button"
              disabled={isSaving}
              onClick={() => void selectRole(card.role)}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left transition hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">{card.role}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
              <p className="mt-6 text-sm font-semibold text-slate-900">
                {isSaving ? "Saving role..." : card.nextStep}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
