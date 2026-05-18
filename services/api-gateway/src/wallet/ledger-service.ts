import { prisma, Prisma } from "@trustlayer/database";

export type WalletAccountType = "AVAILABLE" | "ESCROW" | "PLATFORM_FEES";
export type LedgerDirection = "DEBIT" | "CREDIT";

export type LedgerPostingEntry = {
  walletAccountId: string;
  direction: LedgerDirection;
  amountCents: number;
  currency: string;
};

export type CreateWalletAccountInput = {
  organizationId?: string;
  subjectId?: string;
  currency?: string;
  type?: WalletAccountType;
};

export type PostLedgerTransactionInput = {
  reference: string;
  type: string;
  description?: string;
  metadata?: Record<string, unknown>;
  entries: LedgerPostingEntry[];
};

export function assertPositiveAmount(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Ledger entry amount must be a positive integer.");
  }
}

export function assertBalancedEntries(entries: LedgerPostingEntry[]): void {
  if (entries.length < 2) {
    throw new Error("Ledger transaction requires at least two entries.");
  }

  const currencies = new Set(entries.map((entry) => entry.currency));

  if (currencies.size !== 1) {
    throw new Error("Ledger transaction entries must use one currency.");
  }

  let debits = 0;
  let credits = 0;

  for (const entry of entries) {
    assertPositiveAmount(entry.amountCents);

    if (entry.direction === "DEBIT") {
      debits += entry.amountCents;
      continue;
    }

    if (entry.direction === "CREDIT") {
      credits += entry.amountCents;
      continue;
    }

    throw new Error("Ledger entry direction must be DEBIT or CREDIT.");
  }

  if (debits !== credits) {
    throw new Error("Ledger transaction must balance debits and credits.");
  }
}

export async function getOrCreateWalletAccount(input: CreateWalletAccountInput) {
  if (!input.organizationId && !input.subjectId) {
    throw new Error("Wallet account requires organizationId or subjectId.");
  }

  const currency = input.currency ?? "GHS";
  const type = input.type ?? "AVAILABLE";

  const existing = await prisma.walletAccount.findFirst({
    where: {
      organizationId: input.organizationId ?? null,
      subjectId: input.subjectId ?? null,
      currency,
      type
    }
  });

  if (existing) {
    if (existing.status !== "ACTIVE") {
      return prisma.walletAccount.update({
        where: { id: existing.id },
        data: { status: "ACTIVE" }
      });
    }

    return existing;
  }

  return prisma.walletAccount.create({
    data: {
      organizationId: input.organizationId,
      subjectId: input.subjectId,
      currency,
      type
    }
  });
}

export async function postLedgerTransaction(input: PostLedgerTransactionInput) {
  assertBalancedEntries(input.entries);

  return prisma.ledgerTransaction.create({
    data: {
      reference: input.reference,
      type: input.type,
      description: input.description,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      entries: {
        create: input.entries.map((entry) => ({
          walletAccountId: entry.walletAccountId,
          direction: entry.direction,
          amountCents: entry.amountCents,
          currency: entry.currency
        }))
      }
    },
    include: {
      entries: true
    }
  });
}

export async function getWalletBalance(walletAccountId: string) {
  const entries = await prisma.ledgerEntry.groupBy({
    by: ["direction", "currency"],
    where: {
      walletAccountId
    },
    _sum: {
      amountCents: true
    }
  });

  const currency = entries[0]?.currency ?? "GHS";
  const debitTotal = entries
    .filter((entry) => entry.direction === "DEBIT")
    .reduce((sum, entry) => sum + (entry._sum.amountCents ?? 0), 0);
  const creditTotal = entries
    .filter((entry) => entry.direction === "CREDIT")
    .reduce((sum, entry) => sum + (entry._sum.amountCents ?? 0), 0);

  return {
    walletAccountId,
    currency,
    debitTotal,
    creditTotal,
    balanceCents: creditTotal - debitTotal
  };
}
