import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    walletAccount: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    ledgerTransaction: {
      create: vi.fn()
    },
    escrowHold: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock("@trustlayer/database", () => ({
  prisma: db,
  Prisma: {}
}));

import {
  cancelEscrow,
  createEscrowHold,
  releaseEscrow
} from "./escrow-service.js";

describe("escrow service business rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    db.walletAccount.findFirst.mockResolvedValue(null);
    db.walletAccount.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: `${data.subjectId ?? data.organizationId}-${data.type}`,
        ...data,
        status: "ACTIVE"
      })
    );

    db.ledgerTransaction.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: `ledger-${data.reference}`,
        ...data,
        entries: data.entries.create
      })
    );
  });

  it("rejects zero or negative escrow hold amounts", async () => {
    await expect(
      createEscrowHold({
        reference: "order_zero",
        buyerSubjectId: "buyer_1",
        sellerSubjectId: "seller_1",
        amountCents: 0
      })
    ).rejects.toThrow("Escrow amount must be a positive integer.");

    await expect(
      createEscrowHold({
        reference: "order_negative",
        buyerSubjectId: "buyer_1",
        sellerSubjectId: "seller_1",
        amountCents: -100
      })
    ).rejects.toThrow("Escrow amount must be a positive integer.");
  });

  it("creates a hold by moving buyer funds from available to escrow", async () => {
    db.escrowHold.create.mockResolvedValue({
      id: "escrow_1",
      reference: "order_100",
      buyerSubjectId: "buyer_1",
      sellerSubjectId: "seller_1",
      amountCents: 10000,
      currency: "GHS",
      status: "HELD",
      metadata: {}
    });

    const result = await createEscrowHold({
      reference: "order_100",
      buyerSubjectId: "buyer_1",
      sellerSubjectId: "seller_1",
      amountCents: 10000,
      currency: "GHS"
    });

    expect(result.ledgerTransaction.type).toBe("ESCROW_HOLD");
    expect(result.ledgerTransaction.entries).toEqual([
      {
        walletAccountId: "buyer_1-AVAILABLE",
        direction: "DEBIT",
        amountCents: 10000,
        currency: "GHS"
      },
      {
        walletAccountId: "buyer_1-ESCROW",
        direction: "CREDIT",
        amountCents: 10000,
        currency: "GHS"
      }
    ]);
  });

  it("rejects release when platform fee is greater than or equal to escrow amount", async () => {
    db.escrowHold.findUnique.mockResolvedValue({
      id: "escrow_1",
      reference: "order_100",
      buyerSubjectId: "buyer_1",
      sellerSubjectId: "seller_1",
      amountCents: 10000,
      currency: "GHS",
      status: "HELD",
      metadata: {}
    });

    await expect(
      releaseEscrow({
        reference: "order_100",
        platformFeeCents: 10000
      })
    ).rejects.toThrow("Platform fee must be less than escrow amount.");
  });

  it("rejects release for non-HELD escrow funds", async () => {
    db.escrowHold.findUnique.mockResolvedValue({
      id: "escrow_1",
      reference: "order_100",
      buyerSubjectId: "buyer_1",
      sellerSubjectId: "seller_1",
      amountCents: 10000,
      currency: "GHS",
      status: "RELEASED",
      metadata: {}
    });

    await expect(
      releaseEscrow({
        reference: "order_100",
        platformFeeCents: 100
      })
    ).rejects.toThrow("Only HELD escrow funds can be released.");
  });

  it("releases escrow with platform fee split", async () => {
    db.escrowHold.findUnique.mockResolvedValue({
      id: "escrow_1",
      reference: "order_100",
      buyerSubjectId: "buyer_1",
      sellerSubjectId: "seller_1",
      amountCents: 10000,
      currency: "GHS",
      status: "HELD",
      metadata: {}
    });

    db.escrowHold.update.mockResolvedValue({
      id: "escrow_1",
      reference: "order_100",
      status: "RELEASED"
    });

    const result = await releaseEscrow({
      reference: "order_100",
      platformFeeCents: 500
    });

    expect(result.ledgerTransaction.type).toBe("ESCROW_RELEASE");
    expect(result.ledgerTransaction.entries).toEqual([
      {
        walletAccountId: "buyer_1-ESCROW",
        direction: "DEBIT",
        amountCents: 10000,
        currency: "GHS"
      },
      {
        walletAccountId: "seller_1-AVAILABLE",
        direction: "CREDIT",
        amountCents: 9500,
        currency: "GHS"
      },
      {
        walletAccountId: "platform-PLATFORM_FEES",
        direction: "CREDIT",
        amountCents: 500,
        currency: "GHS"
      }
    ]);
  });

  it("cancels escrow by returning full amount to buyer available balance", async () => {
    db.escrowHold.findUnique.mockResolvedValue({
      id: "escrow_1",
      reference: "order_100",
      buyerSubjectId: "buyer_1",
      sellerSubjectId: "seller_1",
      amountCents: 10000,
      currency: "GHS",
      status: "HELD",
      metadata: {}
    });

    db.escrowHold.update.mockResolvedValue({
      id: "escrow_1",
      reference: "order_100",
      status: "CANCELED"
    });

    const result = await cancelEscrow({
      reference: "order_100"
    });

    expect(result.ledgerTransaction.type).toBe("ESCROW_CANCEL");
    expect(result.ledgerTransaction.entries).toEqual([
      {
        walletAccountId: "buyer_1-ESCROW",
        direction: "DEBIT",
        amountCents: 10000,
        currency: "GHS"
      },
      {
        walletAccountId: "buyer_1-AVAILABLE",
        direction: "CREDIT",
        amountCents: 10000,
        currency: "GHS"
      }
    ]);
  });
});
