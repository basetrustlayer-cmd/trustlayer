"use client";

import { useEffect, useState } from "react";

type BillingPlan = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  currency: string;
  interval: string;
};

type Subscription = {
  id: string;
  status: string;
  provider: string;
  externalCustomerId?: string | null;
  currentPeriodEnd?: string | null;
  plan: BillingPlan;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  hostedInvoiceUrl?: string | null;
  paidAt?: string | null;
};

type Payment = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  paidAt?: string | null;
};

type BillingData = {
  organization: Organization | null;
  subscription: Subscription | null;
  invoices: Invoice[];
  payments: Payment[];
};

const fallbackPlans = [
  {
    name: "Starter",
    slug: "starter",
    price: "$29/mo",
    description: "For small platforms beginning vendor verification.",
    features: ["Basic verification", "TrustScore access", "Trust badge"]
  },
  {
    name: "Growth",
    slug: "growth",
    price: "$99/mo",
    description: "For growing marketplaces and B2B platforms.",
    features: ["Higher document limits", "API access", "Vendor compliance tools"]
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: "Custom",
    description: "For high-volume platforms and regulated ecosystems.",
    features: ["Custom limits", "Priority support", "Advanced compliance workflows"]
  }
];

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD"
  }).format(amountCents / 100);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [manualOrganizationId, setManualOrganizationId] = useState("");
  const [manualPlanId, setManualPlanId] = useState("");
  const [loading, setLoading] = useState<string | null>("initial");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/billing/subscription")
      .then((response) => response.json())
      .then((data) => {
        setBilling(data);
        if (data.organization?.id) {
          setManualOrganizationId(data.organization.id);
        }
      })
      .catch(() => {
        setError("Could not load billing data.");
      })
      .finally(() => {
        setLoading(null);
      });
  }, []);

  async function startCheckout(selectedPlanId: string) {
    setError("");
    setLoading(selectedPlanId);

    try {
      const organizationId = billing?.organization?.id || manualOrganizationId;

      const data = await postJson("/api/billing/checkout", {
        organizationId,
        planId: selectedPlanId,
        successUrl: `${window.location.origin}/billing?checkout=success`,
        cancelUrl: `${window.location.origin}/billing?checkout=cancelled`
      });

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(null);
    }
  }

  async function manageBilling() {
    setError("");
    setLoading("portal");

    try {
      const organizationId = billing?.organization?.id || manualOrganizationId;

      const data = await postJson("/api/billing/portal", {
        organizationId,
        returnUrl: `${window.location.origin}/billing`
      });

      window.location.href = data.portalUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal failed");
    } finally {
      setLoading(null);
    }
  }

  const organizationId = billing?.organization?.id || manualOrganizationId;
  const currentPlanName = billing?.subscription?.plan?.name || "No active plan";

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 1040 }}>
      <p>
        <a href="/">Back to dashboard</a>
      </p>

      <h1>Billing</h1>
      <p>View your subscription, manage billing, and upgrade your TrustLayer plan.</p>

      {loading === "initial" ? <p>Loading billing data...</p> : null}

      {error ? (
        <section
          style={{
            marginTop: 24,
            padding: 16,
            border: "1px solid #cc0000",
            color: "#cc0000"
          }}
        >
          {error}
        </section>
      ) : null}

      <section
        style={{
          marginTop: 24,
          padding: 20,
          border: "1px solid #ddd",
          display: "grid",
          gap: 8
        }}
      >
        <h2>Current Subscription</h2>
        <p>Organization: {billing?.organization?.name || "No organization linked"}</p>
        <p>Plan: {currentPlanName}</p>
        <p>Status: {billing?.subscription?.status || "Not subscribed"}</p>
        <p>Provider: {billing?.subscription?.provider || "—"}</p>
        <p>Current Period Ends: {formatDate(billing?.subscription?.currentPeriodEnd)}</p>

        {!billing?.organization ? (
          <div style={{ marginTop: 12 }}>
            <p>
              No organization is linked to your platform yet. Enter an
              organization ID manually until onboarding links it automatically.
            </p>
            <input
              value={manualOrganizationId}
              onChange={(event) => setManualOrganizationId(event.target.value)}
              placeholder="Organization ID"
              style={{ width: "100%", maxWidth: 520, padding: 12 }}
            />
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={manageBilling}
            disabled={!organizationId || loading === "portal"}
            style={{ padding: 12 }}
          >
            {loading === "portal" ? "Opening..." : "Manage Billing"}
          </button>
        </div>
      </section>

      <section
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16
        }}
      >
        {fallbackPlans.map((plan) => (
          <article key={plan.slug} style={{ padding: 20, border: "1px solid #ddd" }}>
            <h2>{plan.name}</h2>
            <p style={{ fontSize: 28, fontWeight: "bold" }}>{plan.price}</p>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <input
              value={manualPlanId === plan.slug ? manualPlanId : ""}
              onChange={(event) => setManualPlanId(event.target.value)}
              placeholder={`${plan.name} plan ID`}
              style={{ width: "100%", padding: 10, marginBottom: 12 }}
            />

            <button
              type="button"
              disabled={!organizationId || !manualPlanId || loading === manualPlanId}
              onClick={() => startCheckout(manualPlanId)}
              style={{ padding: 12, width: "100%" }}
            >
              {loading === manualPlanId ? "Redirecting..." : `Choose ${plan.name}`}
            </button>
          </article>
        ))}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Recent Invoices</h2>
        {billing?.invoices?.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                  Invoice
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                  Status
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                  Total
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                  Paid
                </th>
              </tr>
            </thead>
            <tbody>
              {billing.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    {invoice.hostedInvoiceUrl ? (
                      <a href={invoice.hostedInvoiceUrl}>{invoice.invoiceNumber}</a>
                    ) : (
                      invoice.invoiceNumber
                    )}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    {invoice.status}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    {formatMoney(invoice.totalCents, invoice.currency)}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    {formatDate(invoice.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No invoices yet.</p>
        )}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Recent Payments</h2>
        {billing?.payments?.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                  Status
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                  Amount
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                  Paid
                </th>
              </tr>
            </thead>
            <tbody>
              {billing.payments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    {payment.status}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    {formatMoney(payment.amountCents, payment.currency)}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    {formatDate(payment.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No payments yet.</p>
        )}
      </section>
    </main>
  );
}
