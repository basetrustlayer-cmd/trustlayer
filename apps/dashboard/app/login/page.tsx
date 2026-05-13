"use client";

import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    if (!response.ok) {
      setError("Invalid email or password.");
      return;
    }

    window.location.href = "/";
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 480 }}>
      <h1>Log in to TrustLayer</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input name="email" type="email" placeholder="Email" required style={{ padding: 12 }} />
        <input name="password" type="password" placeholder="Password" required style={{ padding: 12 }} />
        <button type="submit" style={{ padding: 12 }}>Log in</button>
      </form>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      <p>No account? <a href="/register">Register</a></p>
    </main>
  );
}
