import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { AuthTextField } from "../components/AuthTextField";
import { useAuth } from "../hooks/useAuth";

function validate(values: { name: string; email: string; password: string; confirmPassword: string }) {
  const errors: Partial<Record<keyof typeof values, string>> = {};

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  }

  if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "password" | "confirmPassword", string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate({ name, email, password, confirmPassword });
    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({ name, email, password });
      navigate("/onboarding", { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Signup"
      title="Create your Ascend account"
      description="Create a user once, receive a JWT session immediately, and continue into role onboarding."
      footer={
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Get started</h2>
          <p className="mt-2 text-sm text-slate-600">Create an account to save your role and session.</p>
        </div>

        <AuthTextField
          label="Name"
          name="name"
          autoComplete="name"
          value={name}
          error={errors.name}
          onChange={setName}
        />
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
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={setPassword}
        />
        <AuthTextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={setConfirmPassword}
        />

        {formError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
