"use client";

import { useState } from "react";

const plans = [
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
  const [organizationId, setOrganizationId] = useState("");
  const [planId, setPlanId] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(selectedPlanId: string) {
    setError("");
    setLoading(selectedPlanId);

    try {
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

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 980 }}>
      <p>
        <a href="/">Back to dashboard</a>
      </p>

      <h1>Billing</h1>
      <p>Choose a TrustLayer plan or manage your existing Stripe subscription.</p>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
        <h2>Organization</h2>
        <p>Enter the organization ID for this billing action.</p>
        <input
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
          placeholder="Organization ID"
          style={{ width: "100%", maxWidth: 520, padding: 12 }}
        />
        <div style={{ marginTop: 16 }}>
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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16
        }}
      >
        {plans.map((plan) => (
          <article
            key={plan.slug}
            style={{ padding: 20, border: "1px solid #ddd" }}
          >
            <h2>{plan.name}</h2>
            <p style={{ fontSize: 28, fontWeight: "bold" }}>{plan.price}</p>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <input
              value={planId === plan.slug ? planId : ""}
              onChange={(event) => setPlanId(event.target.value)}
              placeholder={`${plan.name} plan ID`}
              style={{ width: "100%", padding: 10, marginBottom: 12 }}
            />

            <button
              type="button"
              disabled={!organizationId || !planId || loading === planId}
              onClick={() => startCheckout(planId)}
              style={{ padding: 12, width: "100%" }}
            >
              {loading === planId ? "Redirecting..." : `Choose ${plan.name}`}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
