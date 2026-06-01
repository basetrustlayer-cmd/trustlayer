import { prisma } from "@trustlayer/database";

export async function sweepExpiredSessions(): Promise<number> {
  const now = new Date();
  const result = await prisma.verificationSession.updateMany({
    where: {
      status: "OTP_SENT",
      expiresAt: { lt: now }
    },
    data: { status: "EXPIRED" }
  });
  return result.count;
}
