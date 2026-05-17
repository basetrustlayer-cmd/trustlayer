import { prisma, Prisma } from "@trustlayer/database";
import {
  getOrCreateWalletAccount,
  postLedgerTransaction
} from "../wallet/ledger-service.js";

export type CreateEscrowHoldInput = {
  reference: string;
  buyerSubjectId: string;
  sellerSubjectId: string;
  amountCents: number;
  currency?: string;
  metadata?: Record<string, unknown>;
};

export type ReleaseEscrowInput = {
  reference: string;
  platformFeeCents?: number;
  description?: string;
};

export type CancelEscrowInput = {
  reference: string;
  description?: string;
};

function assertPositiveAmount(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Escrow amount must be a positive integer.");
  }
}

function assertNonNegativeAmount(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error("Platform fee must be a non-negative integer.");
  }
}

export async function createEscrowHold(input: CreateEscrowHoldInput) {
  assertPositiveAmount(input.amountCents);

  const currency = input.currency ?? "GHS";

  const buyerAvailable = await getOrCreateWalletAccount({
    subjectId: input.buyerSubjectId,
    currency,
    type: "AVAILABLE"
  });

  const buyerEscrow = await getOrCreateWalletAccount({
    subjectId: input.buyerSubjectId,
    currency,
    type: "ESCROW"
  });

  const hold = await prisma.escrowHold.create({
    data: {
      reference: input.reference,
      buyerSubjectId: input.buyerSubjectId,
      sellerSubjectId: input.sellerSubjectId,
      amountCents: input.amountCents,
      currency,
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });

  const ledgerTransaction = await postLedgerTransaction({
    reference: `escrow_hold:${input.reference}`,
    type: "ESCROW_HOLD",
    description: "Move buyer funds from available balance into escrow.",
    metadata: {
      escrowHoldId: hold.id,
      escrowReference: input.reference
    },
    entries: [
      {
        walletAccountId: buyerAvailable.id,
        direction: "DEBIT",
        amountCents: input.amountCents,
        currency
      },
      {
        walletAccountId: buyerEscrow.id,
        direction: "CREDIT",
        amountCents: input.amountCents,
        currency
      }
    ]
  });

  return {
    hold,
    ledgerTransaction
  };
}

export async function releaseEscrow(input: ReleaseEscrowInput) {
  const hold = await prisma.escrowHold.findUnique({
    where: { reference: input.reference }
  });

  if (!hold) {
    throw new Error("Escrow hold not found.");
  }

  if (hold.status !== "HELD") {
    throw new Error("Only HELD escrow funds can be released.");
  }

  const platformFeeCents = input.platformFeeCents ?? 0;
  assertNonNegativeAmount(platformFeeCents);

  if (platformFeeCents >= hold.amountCents) {
    throw new Error("Platform fee must be less than escrow amount.");
  }

  const sellerAmountCents = hold.amountCents - platformFeeCents;

  const buyerEscrow = await getOrCreateWalletAccount({
    subjectId: hold.buyerSubjectId,
    currency: hold.currency,
    type: "ESCROW"
  });

  const sellerAvailable = await getOrCreateWalletAccount({
    subjectId: hold.sellerSubjectId,
    currency: hold.currency,
    type: "AVAILABLE"
  });

  const entries = [
    {
      walletAccountId: buyerEscrow.id,
      direction: "DEBIT" as const,
      amountCents: hold.amountCents,
      currency: hold.currency
    },
    {
      walletAccountId: sellerAvailable.id,
      direction: "CREDIT" as const,
      amountCents: sellerAmountCents,
      currency: hold.currency
    }
  ];

  if (platformFeeCents > 0) {
    const platformFees = await getOrCreateWalletAccount({
      organizationId: "platform",
      currency: hold.currency,
      type: "PLATFORM_FEES"
    });

    entries.push({
      walletAccountId: platformFees.id,
      direction: "CREDIT",
      amountCents: platformFeeCents,
      currency: hold.currency
    });
  }

  const ledgerTransaction = await postLedgerTransaction({
    reference: `escrow_release:${input.reference}`,
    type: "ESCROW_RELEASE",
    description: input.description ?? "Release escrow funds to seller.",
    metadata: {
      escrowHoldId: hold.id,
      escrowReference: input.reference,
      platformFeeCents
    },
    entries
  });

  const updatedHold = await prisma.escrowHold.update({
    where: { id: hold.id },
    data: {
      status: "RELEASED",
      releasedAt: new Date()
    }
  });

  return {
    hold: updatedHold,
    ledgerTransaction
  };
}

export async function cancelEscrow(input: CancelEscrowInput) {
  const hold = await prisma.escrowHold.findUnique({
    where: { reference: input.reference }
  });

  if (!hold) {
    throw new Error("Escrow hold not found.");
  }

  if (hold.status !== "HELD") {
    throw new Error("Only HELD escrow funds can be canceled.");
  }

  const buyerEscrow = await getOrCreateWalletAccount({
    subjectId: hold.buyerSubjectId,
    currency: hold.currency,
    type: "ESCROW"
  });

  const buyerAvailable = await getOrCreateWalletAccount({
    subjectId: hold.buyerSubjectId,
    currency: hold.currency,
    type: "AVAILABLE"
  });

  const ledgerTransaction = await postLedgerTransaction({
    reference: `escrow_cancel:${input.reference}`,
    type: "ESCROW_CANCEL",
    description: input.description ?? "Return escrow funds to buyer.",
    metadata: {
      escrowHoldId: hold.id,
      escrowReference: input.reference
    },
    entries: [
      {
        walletAccountId: buyerEscrow.id,
        direction: "DEBIT",
        amountCents: hold.amountCents,
        currency: hold.currency
      },
      {
        walletAccountId: buyerAvailable.id,
        direction: "CREDIT",
        amountCents: hold.amountCents,
        currency: hold.currency
      }
    ]
  });

  const updatedHold = await prisma.escrowHold.update({
    where: { id: hold.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date()
    }
  });

  return {
    hold: updatedHold,
    ledgerTransaction
  };
}
