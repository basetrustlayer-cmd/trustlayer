"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    if (!response.ok) {
      setError("Could not create account.");
      return;
    }

    window.location.href = "/";
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 480 }}>
      <h1>Create your TrustLayer account</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input name="name" type="text" placeholder="Name" required style={{ padding: 12 }} />
        <input name="email" type="email" placeholder="Email" required style={{ padding: 12 }} />
        <input name="password" type="password" placeholder="Password, minimum 8 characters" required style={{ padding: 12 }} />
        <button type="submit" style={{ padding: 12 }}>Create account</button>
      </form>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      <p>Already have an account? <a href="/login">Log in</a></p>
    </main>
  );
}
