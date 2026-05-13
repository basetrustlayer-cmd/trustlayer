#!/usr/bin/env bash
set -euo pipefail

mkdir -p apps/dashboard/app/login
mkdir -p apps/dashboard/app/register
mkdir -p apps/dashboard/app/api/auth/register
mkdir -p apps/dashboard/app/api/auth/login
mkdir -p apps/dashboard/app/api/auth/logout
mkdir -p apps/dashboard/lib

cat > apps/dashboard/lib/db.ts <<'INNER'
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
INNER

cat > apps/dashboard/lib/session.ts <<'INNER'
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SESSION_COOKIE = "trustlayer_session";

export type SessionUser = {
  id: string;
  email: string;
  role: "ADMIN" | "VENDOR" | "BUYER";
};

export function signSession(user: SessionUser) {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-before-production";
  return jwt.sign(user, secret, { expiresIn: "7d" });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const secret = process.env.AUTH_SECRET || "dev-secret-change-before-production";
    return jwt.verify(token, secret) as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
INNER

cat > apps/dashboard/app/register/page.tsx <<'INNER'
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
INNER

cat > apps/dashboard/app/login/page.tsx <<'INNER'
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
INNER
