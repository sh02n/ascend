import type { PropsWithChildren } from "react";

type PageShellProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}
