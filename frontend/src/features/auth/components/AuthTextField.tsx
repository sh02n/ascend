type AuthTextFieldProps = {
  label: string;
  name: string;
  type?: "email" | "password" | "text";
  value: string;
  error?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
};

export function AuthTextField({
  label,
  name,
  type = "text",
  value,
  error,
  autoComplete,
  onChange,
}: AuthTextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition ${
          error
            ? "border-rose-300 bg-rose-50 focus:border-rose-400"
            : "border-slate-300 bg-white focus:border-teal-500"
        }`}
      />
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}
