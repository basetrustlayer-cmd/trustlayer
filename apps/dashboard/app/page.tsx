import { redirect } from "next/navigation";
import { getSessionUser } from "../lib/session";
import { prisma } from "../lib/db";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          companyProfile: true
        }
      }
    }
  });

  const hasCompanyProfile = Boolean(membership?.organization.companyProfile);

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>TrustLayer Dashboard</h1>
      <p>Vendor verification, compliance status, and trust workflows.</p>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd", maxWidth: 640 }}>
        <h2>Onboarding Status</h2>
        <p>Company Profile: {hasCompanyProfile ? "Complete" : "Incomplete"}</p>
        <a href="/onboarding/company">
          {hasCompanyProfile ? "Edit company profile" : "Complete company profile"}
        </a>
      </section>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd", maxWidth: 640 }}>
        <h2>Compliance Documents</h2>
        <p>Upload incorporation, tax, VAT, permits, insurance, and sector-specific verification documents.</p>
        <a href="/compliance/documents">Manage compliance documents</a>
        <br />
        <a href="/compliance/status">View compliance status</a>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Signed in</h2>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
        <form action="/api/auth/logout" method="post">
          <button type="submit" style={{ padding: 12 }}>Log out</button>
        </form>
      </section>
    </main>
  );
}
