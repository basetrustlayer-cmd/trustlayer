import { redirect } from "next/navigation";
import { getSessionUser } from "../lib/session";
import { prisma } from "../lib/db";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const platform = await prisma.platform.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });

  const hasPlatform = Boolean(platform);

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>TrustLayer Dashboard</h1>

      <p>
        Identity verification, TrustScore APIs, API key management, and webhooks
        for platform integrators.
      </p>

      <section
        style={{
          marginTop: 24,
          padding: 20,
          border: "1px solid #ddd",
          maxWidth: 640
        }}
      >
        <h2>Platform Registration</h2>
        <p>Status: {hasPlatform ? "Complete" : "Incomplete"}</p>
        <a href="/onboarding/company">
          {hasPlatform ? "Edit platform registration" : "Complete platform registration"}
        </a>
      </section>

      <section
        style={{
          marginTop: 24,
          padding: 20,
          border: "1px solid #ddd",
          maxWidth: 640
        }}
      >
        <h2>Developer Tools</h2>
        <a href="/trust-score">View TrustScore</a>
        <br />
        <a href="/verification/requests">Manage verification requests</a>
        <br />
        <a href="/certification/badge">View trust badge</a>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Signed in</h2>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
        <form action="/api/auth/logout" method="post">
          <button type="submit" style={{ padding: 12 }}>
            Log out
          </button>
        </form>
      </section>
    </main>
  );
}
