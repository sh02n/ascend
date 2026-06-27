import type { PropsWithChildren } from "react";

type PlaceholderPanelProps = PropsWithChildren<{
  title: string;
  todo: string;
}>;

export function PlaceholderPanel({ title, todo, children }: PlaceholderPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-slate-500">{todo}</p>
      </div>
      {children}
    </div>
  );
}
