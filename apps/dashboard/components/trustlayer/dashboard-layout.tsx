import type { ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <SidebarNav />

        <div className="min-w-0">
          {children}
        </div>
      </section>
    </main>
  );
}
