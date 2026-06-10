import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        {eyebrow ? (
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
