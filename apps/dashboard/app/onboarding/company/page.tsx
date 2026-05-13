"use client";

import { useEffect, useState } from "react";

type CompanyProfile = {
  legalName?: string;
  tradeName?: string;
  entityType?: string;
  taxId?: string;
  website?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  industry?: string;
};

export default function CompanyOnboardingPage() {
  const [profile, setProfile] = useState<CompanyProfile>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/company-profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.companyProfile) setProfile(data.companyProfile);
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const formData = new FormData(event.currentTarget);

    const payload = {
      legalName: formData.get("legalName"),
      tradeName: formData.get("tradeName") || undefined,
      entityType: formData.get("entityType"),
      taxId: formData.get("taxId") || undefined,
      website: formData.get("website") || undefined,
      phone: formData.get("phone") || undefined,
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2") || undefined,
      city: formData.get("city"),
      state: formData.get("state"),
      postalCode: formData.get("postalCode"),
      country: formData.get("country") || "US",
      industry: formData.get("industry")
    };

    const response = await fetch("/api/company-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Could not save company profile.");
      return;
    }

    const data = await response.json();
    setProfile(data.companyProfile);
    setStatus("Company profile saved.");
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 760 }}>
      <h1>Company Onboarding</h1>
      <p>Complete your business profile so TrustLayer can begin verification workflows.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 24 }}>
        <input name="legalName" placeholder="Legal business name" defaultValue={profile.legalName || ""} required style={{ padding: 12 }} />
        <input name="tradeName" placeholder="Trade name / DBA" defaultValue={profile.tradeName || ""} style={{ padding: 12 }} />
        <input name="entityType" placeholder="Entity type, e.g. LLC, Corporation" defaultValue={profile.entityType || ""} required style={{ padding: 12 }} />
        <input name="taxId" placeholder="Tax ID / EIN" defaultValue={profile.taxId || ""} style={{ padding: 12 }} />
        <input name="industry" placeholder="Industry" defaultValue={profile.industry || ""} required style={{ padding: 12 }} />
        <input name="website" placeholder="Website" defaultValue={profile.website || ""} style={{ padding: 12 }} />
        <input name="phone" placeholder="Phone" defaultValue={profile.phone || ""} style={{ padding: 12 }} />
        <input name="addressLine1" placeholder="Address line 1" defaultValue={profile.addressLine1 || ""} required style={{ padding: 12 }} />
        <input name="addressLine2" placeholder="Address line 2" defaultValue={profile.addressLine2 || ""} style={{ padding: 12 }} />
        <input name="city" placeholder="City" defaultValue={profile.city || ""} required style={{ padding: 12 }} />
        <input name="state" placeholder="State" defaultValue={profile.state || ""} required style={{ padding: 12 }} />
        <input name="postalCode" placeholder="Postal code" defaultValue={profile.postalCode || ""} required style={{ padding: 12 }} />
        <input name="country" placeholder="Country" defaultValue={profile.country || "US"} required style={{ padding: 12 }} />
        <button type="submit" style={{ padding: 12 }}>Save company profile</button>
      </form>

      {status ? <p style={{ marginTop: 16 }}>{status}</p> : null}
      <p style={{ marginTop: 24 }}><a href="/">Back to dashboard</a></p>
    </main>
  );
}
