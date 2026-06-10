import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
      {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      ) : null}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}
