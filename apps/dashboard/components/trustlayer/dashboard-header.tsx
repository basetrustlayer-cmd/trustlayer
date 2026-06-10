import Link from "next/link";
import { PageHeader } from "./page-header";

type DashboardHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export function DashboardHeader({
  eyebrow,
  title,
  description,
  backHref = "/",
  backLabel = "Back to Trust Center"
}: DashboardHeaderProps) {
  return (
    <header>
      <Link
        href={backHref}
        className="text-sm font-medium text-cyan-200 hover:text-cyan-100"
      >
        ← {backLabel}
      </Link>

      <div className="mt-6">
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
      </div>
    </header>
  );
}
