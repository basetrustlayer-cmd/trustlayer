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
