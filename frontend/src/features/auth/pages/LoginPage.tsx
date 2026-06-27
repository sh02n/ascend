import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDefaultPathForRole } from "../../../core/session/roleSession";
import { consumeAuthNotice } from "../../../core/session/authSession";
import { AuthShell } from "../components/AuthShell";
import { AuthTextField } from "../components/AuthTextField";
import { useAuth } from "../hooks/useAuth";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

function validate(values: { email: string; password: string }) {
  const errors: Partial<Record<keyof typeof values, string>> = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  }

  return errors;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const notice = consumeAuthNotice();

    if (notice) {
      setFormError(notice);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate({ email, password });
    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login({ email, password, rememberMe });
      const state = location.state as { from?: string } | null;
      navigate(state?.from ?? (user.role ? getDefaultPathForRole(user.role) : "/onboarding"), { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoEntry() {
    setFormError(null);
    setIsSubmitting(true);

    try {
      const user = await loginDemo();
      navigate(user.role ? getDefaultPathForRole(user.role) : "/verify", { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to enter demo mode right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Login"
      title="Sign in to Ascend"
      description="Use your account to continue into the fraud platform and resume your saved role automatically."
      footer={
        <p className="text-sm text-slate-600">
          Don&apos;t have an account yet?{" "}
          <Link to="/signup" className="font-semibold text-teal-700 hover:text-teal-800">
            Create one
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600">Enter your email and password to continue.</p>
        </div>

        <AuthTextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={setEmail}
        />
        <AuthTextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={setPassword}
        />

        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-200"
          />
          Remember me
        </label>

        {formError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div> : null}

        {DEMO_MODE ? (
          <button
            type="button"
            onClick={() => void handleDemoEntry()}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Opening demo..." : "Enter Demo"}
          </button>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
