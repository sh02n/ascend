import type { PropsWithChildren, ReactNode } from "react";

type AuthShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
}>;

export function AuthShell({ eyebrow, title, description, footer, children }: AuthShellProps) {
  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.15),_transparent_35%),linear-gradient(180deg,_#F8FAFC_0%,_#ECFDF5_100%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-slate-950 p-10 text-white shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-300">{eyebrow}</p>
            <h1 className="mt-6 max-w-md text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">{description}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Business flow</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Scenario, detect, investigate, and dashboard remain available after sign-in.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Consumer flow</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Verify, analysis, and insights now deliver a lightweight shopper trust journey.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            {children}
            {footer ? <div className="mt-6 border-t border-slate-200 pt-5">{footer}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
