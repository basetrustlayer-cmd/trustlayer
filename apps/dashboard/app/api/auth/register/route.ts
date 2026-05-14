import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { setSessionCookie, signSession } from "../../../../lib/session";
import { getRequestIp, rateLimit } from "../../../../lib/security/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limited = rateLimit(`register:${ip}`, 5, 60_000);

  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again shortly." },
      { status: 429 }
    );
  }

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
      role: "INTEGRATOR"
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
