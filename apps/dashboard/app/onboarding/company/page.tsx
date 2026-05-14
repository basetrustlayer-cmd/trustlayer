"use client";

import { useEffect, useState } from "react";

type Platform = {
  name?: string;
  website?: string | null;
  contactEmail?: string;
  planTier?: string;
};

export default function PlatformOnboardingPage() {
  const [platform, setPlatform] = useState<Platform>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/company-profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.platform) {
          setPlatform(data.platform);
        }
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const formData = new FormData(event.currentTarget);

    const payload = {
      name: formData.get("name"),
      website: formData.get("website") || "",
      contactEmail: formData.get("contactEmail"),
      planTier: formData.get("planTier")
    };

    const response = await fetch("/api/company-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Could not save platform registration.");
      return;
    }

    const data = await response.json();
    setPlatform(data.platform);
    setStatus("Platform registration saved.");
  }

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial, sans-serif",
        maxWidth: 760
      }}
    >
      <h1>Platform Registration</h1>
      <p>
        Register your application to obtain API keys, configure webhooks,
        and access TrustLayer identity and TrustScore APIs.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: 12,
          marginTop: 24
        }}
      >
        <input
          name="name"
          placeholder="Platform name"
          defaultValue={platform.name || ""}
          required
          style={{ padding: 12 }}
        />

        <input
          name="website"
          placeholder="https://example.com"
          defaultValue={platform.website || ""}
          style={{ padding: 12 }}
        />

        <input
          name="contactEmail"
          type="email"
          placeholder="technical-contact@example.com"
          defaultValue={platform.contactEmail || ""}
          required
          style={{ padding: 12 }}
        />

        <select
          name="planTier"
          defaultValue={platform.planTier || "sandbox"}
          style={{ padding: 12 }}
        >
          <option value="sandbox">Sandbox</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <button type="submit" style={{ padding: 12 }}>
          Save platform registration
        </button>
      </form>

      {status ? <p style={{ marginTop: 16 }}>{status}</p> : null}

      <p style={{ marginTop: 24 }}>
        <a href="/">Back to dashboard</a>
      </p>
    </main>
  );
}
