import Link from "next/link";

const navSections = [
  {
    title: "Entity",
    links: [
      { label: "Entity Home", href: "/entity" },
      { label: "Verification", href: "/verification/requests" },
      { label: "TrustScore", href: "/trust-score" },
      { label: "Trust Badge", href: "/certification/badge" },
      { label: "Public Profile", href: "/vendors/entity_001" }
    ]
  },
  {
    title: "Integrator",
    links: [
      { label: "Home", href: "/integrators" },
      { label: "Trial", href: "/integrators/trial" },
      { label: "Developer", href: "/integrators/developer" },
      { label: "Docs", href: "/integrators/docs" },
      { label: "Playground", href: "/integrators/playground" },
      { label: "Production", href: "/integrators/production" }
    ]
  },
  {
    title: "Operations",
    links: [
      { label: "Billing", href: "/integrators/billing" },
      { label: "Analytics", href: "/integrators/analytics" },
      { label: "Webhooks", href: "/integrators/webhooks" },
      { label: "Admin Console", href: "/integrators/admin" }
    ]
  },
  {
    title: "Trust APIs",
    links: [
      { label: "Verification API", href: "/integrators/verification" },
      { label: "TrustScore API", href: "/integrators/trustscore" },
      { label: "Badge API", href: "/integrators/badges" },
      { label: "Registry API", href: "/integrators/registry" }
    ]
  }
];

export function SidebarNav() {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <Link href="/" className="text-lg font-semibold text-white">
        TrustLayer
      </Link>

      <nav className="mt-6 grid gap-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              {section.title}
            </p>

            <div className="mt-3 grid gap-2">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
