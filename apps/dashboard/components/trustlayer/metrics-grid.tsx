import { ReactNode } from "react";

type MetricsGridProps = {
  children: ReactNode;
};

export function MetricsGrid({
  children
}: MetricsGridProps) {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-4">
      {children}
    </section>
  );
}
