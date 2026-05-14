import { Prisma } from "@prisma/client";
import { prisma } from "../db";

type AuditLogInput = {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  notes?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function createAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      notes: input.notes ?? null,
      metadata: input.metadata ?? Prisma.JsonNull
    }
  });
}
