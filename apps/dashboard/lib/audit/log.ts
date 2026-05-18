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

function assertSafePostgresSetting(value: string, fieldName: string) {
  if (!value || value.includes("'") || value.includes(";") || value.includes("\\")) {
    throw new Error(`${fieldName} contains unsafe characters.`);
  }
}

export async function createAuditLog(input: AuditLogInput) {
  assertSafePostgresSetting(input.organizationId, "organizationId");

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config('app.current_organization_id', ${input.organizationId}, true)
    `;

    return tx.auditLog.create({
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
  });
}
