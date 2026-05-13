#!/usr/bin/env bash
set -euo pipefail

mkdir -p apps/dashboard/app/login
mkdir -p apps/dashboard/app/register
mkdir -p apps/dashboard/app/api/auth/register
mkdir -p apps/dashboard/app/api/auth/login
mkdir -p apps/dashboard/app/api/auth/logout
mkdir -p apps/dashboard/lib

node - <<'NODE'
const fs = require("fs");
const path = "apps/dashboard/package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));

pkg.dependencies = {
  ...pkg.dependencies,
  "@prisma/client": "^6.0.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "zod": "^3.24.0"
};

pkg.devDependencies = {
  ...pkg.devDependencies,
  "@types/bcryptjs": "^2.4.6",
  "@types/jsonwebtoken": "^9.0.7"
};

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
NODE

python3 - <<'PY'
from pathlib import Path

p = Path("packages/database/prisma/schema.prisma")
s = p.read_text()

if "enum UserRole" not in s:
    s = s.replace(
'''enum VerificationStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}
''',
'''enum VerificationStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}

enum UserRole {
  ADMIN
  VENDOR
  BUYER
}
'''
)

s = s.replace(
'''model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  memberships Membership[]
}
''',
'''model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String?
  role         UserRole @default(VENDOR)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  memberships Membership[]
}
'''
)

p.write_text(s)
PY

cat > apps/dashboard/lib/db.ts <<'EOF'
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
EOF

cat > apps/dashboard/lib/session.ts <<'EOF'
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

  return jwt.sign(user, secret, {
    expiresIn: "7d"
  });
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
EOF

cat > apps/dashboard/app/api/auth/register/route.ts <<'EOF'
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { setSessionCookie, signSession } from "../../../../lib/session";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "VENDOR"
    }
  });

  const token = signSession({
    id: user.id,
    email: user.email,
    role: user.role
  });

  await setSessionCookie(token);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}
EOF

cat > apps/dashboard/app/api/auth/login/route.ts <<'EOF'
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { setSessionCookie, signSession } from "../../../../lib/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login data" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signSession({
    id: user.id,
    email: user.email,
    role: user.role
  });

  await setSessionCookie(token);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}
EOF

cat > apps/dashboard/app/api/auth/logout/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/session";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
EOF

cat > apps/dashboard/app/login/page.tsx <<'EOF'
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
      <p>
        No account? <a href="/register">Register</a>
      </p>
    </main>
  );
}
EOF

cat > apps/dashboard/app/register/page.tsx <<'EOF'
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
      <p>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
  );
}
EOF

cat > apps/dashboard/app/page.tsx <<'EOF'
import { redirect } from "next/navigation";
import { getSessionUser } from "../lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>TrustLayer Dashboard</h1>
      <p>Vendor verification, compliance status, and trust workflows.</p>
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
EOF

cat > apps/dashboard/.env.local <<'EOF'
DATABASE_URL="postgresql://postgres@localhost:5432/trustlayer_dev?schema=public"
AUTH_SECRET="trustlayer-local-development-secret-change-before-production"
EOF

echo "Epic 4 authentication scaffold complete."
