import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { setSessionCookie, signSession } from "../../../../lib/session";
import { getRequestIp, rateLimit } from "../../../../lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limited = rateLimit(`login:${ip}`, 5, 60_000);

  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again shortly." },
      { status: 429 }
    );
  }

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
