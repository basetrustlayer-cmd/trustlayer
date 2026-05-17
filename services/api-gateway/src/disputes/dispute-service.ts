import { prisma, Prisma } from "@trustlayer/database";
import { cancelEscrow, releaseEscrow } from "../escrow/escrow-service.js";

export type OpenDisputeInput = {
  filerSubjectId: string;
  respondentSubjectId: string;
  filerRole: "BUYER" | "SELLER";
  respondentRole: "BUYER" | "SELLER";
  reason: string;
  escrowReference?: string;
  metadata?: Record<string, unknown>;
};

export type AddDisputeEvidenceInput = {
  disputeId: string;
  submittedBySubjectId: string;
  evidenceType: string;
  description?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export type ResolveDisputeInput = {
  disputeId: string;
  resolution: "RELEASE_TO_SELLER" | "REFUND_BUYER" | "NO_ESCROW_ACTION";
  faultParty?: "BUYER" | "SELLER" | "BOTH" | "NONE";
  reason?: string;
  platformFeeCents?: number;
};

function readMetadata(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getEvidence(metadata: Record<string, unknown>): unknown[] {
  const evidence = metadata.evidence;

  if (Array.isArray(evidence)) {
    return evidence;
  }

  return [];
}

export async function openDispute(input: OpenDisputeInput) {
  if (input.filerSubjectId === input.respondentSubjectId) {
    throw new Error("Dispute filer and respondent must be different subjects.");
  }

  if (input.filerRole === input.respondentRole) {
    throw new Error("Dispute parties must have different roles.");
  }

  if (!input.reason.trim()) {
    throw new Error("Dispute reason is required.");
  }

  return prisma.dispute.create({
    data: {
      filerSubjectId: input.filerSubjectId,
      respondentSubjectId: input.respondentSubjectId,
      filerRole: input.filerRole,
      respondentRole: input.respondentRole,
      reason: input.reason,
      metadata: {
        ...(input.metadata ?? {}),
        escrowReference: input.escrowReference,
        evidence: []
      } as Prisma.InputJsonValue
    }
  });
}

export async function addDisputeEvidence(input: AddDisputeEvidenceInput) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: input.disputeId }
  });

  if (!dispute) {
    throw new Error("Dispute not found.");
  }

  if (dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW") {
    throw new Error("Evidence can only be added to open or under-review disputes.");
  }

  const metadata = readMetadata(dispute.metadata);
  const evidence = getEvidence(metadata);

  evidence.push({
    submittedBySubjectId: input.submittedBySubjectId,
    evidenceType: input.evidenceType,
    description: input.description,
    url: input.url,
    metadata: input.metadata ?? {},
    submittedAt: new Date().toISOString()
  });

  return prisma.dispute.update({
    where: { id: dispute.id },
    data: {
      status: "UNDER_REVIEW",
      metadata: {
        ...metadata,
        evidence
      } as Prisma.InputJsonValue
    }
  });
}

export async function resolveDispute(input: ResolveDisputeInput) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: input.disputeId }
  });

  if (!dispute) {
    throw new Error("Dispute not found.");
  }

  if (dispute.status === "RESOLVED") {
    throw new Error("Dispute is already resolved.");
  }

  const metadata = readMetadata(dispute.metadata);
  const escrowReference = metadata.escrowReference;

  let escrowActionResult: unknown = null;

  if (input.resolution === "RELEASE_TO_SELLER") {
    if (typeof escrowReference !== "string") {
      throw new Error("Escrow reference is required to release funds.");
    }

    escrowActionResult = await releaseEscrow({
      reference: escrowReference,
      platformFeeCents: input.platformFeeCents,
      description: input.reason ?? "Dispute resolved: release funds to seller."
    });
  }

  if (input.resolution === "REFUND_BUYER") {
    if (typeof escrowReference !== "string") {
      throw new Error("Escrow reference is required to refund buyer.");
    }

    escrowActionResult = await cancelEscrow({
      reference: escrowReference,
      description: input.reason ?? "Dispute resolved: refund buyer."
    });
  }

  const resolvedDispute = await prisma.dispute.update({
    where: { id: dispute.id },
    data: {
      status: "RESOLVED",
      faultParty: input.faultParty ?? "NONE",
      resolution: input.resolution,
      reason: input.reason ?? dispute.reason,
      metadata: {
        ...metadata,
        resolvedAt: new Date().toISOString(),
        escrowActionResult
      } as Prisma.InputJsonValue
    }
  });

  return {
    dispute: resolvedDispute,
    escrowActionResult
  };
}
