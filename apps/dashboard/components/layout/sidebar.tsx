"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  Code2,
  FileShield,
  Gauge,
  Settings,
  ShieldAlert,
} from "lucide-react";

const navigation = [
  { label: "Trust Center", href: "/dashboard", icon: Gauge },
  { label: "Verification", href: "/dashboard/verification", icon: BadgeCheck },
  { label: "TrustScores", href: "/dashboard/trust-scores", icon: Activity },
  { label: "Fraud Intelligence", href: "/dashboard/fraud", icon: ShieldAlert },
  { label: "Developers", href: "/dashboard/developers", icon: Code2 },
  { label: "Compliance", href: "/dashboard/compliance", icon: FileShield },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-white px-4 py-5 lg:block">
      <div className="mb-8">
        <Link href="/dashboard" className="block">
          <p className="text-lg font-bold tracking-tight text-slate-950">
            TrustLayer
          </p>
          <p className="text-xs text-slate-500">
            Sovereign trust infrastructure
          </p>
        </Link>
      </div>

      <nav aria-label="Dashboard navigation" className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
