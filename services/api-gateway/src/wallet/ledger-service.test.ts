import { describe, expect, it, vi } from "vitest";

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
    ledgerEntry: {
      groupBy: vi.fn()
    }
  }
}));

vi.mock("@trustlayer/database", () => ({
  prisma: db,
  Prisma: {}
}));

import {
  assertBalancedEntries,
  assertPositiveAmount
} from "./ledger-service.js";

describe("wallet ledger business rules", () => {
  it("rejects non-positive ledger amounts", () => {
    expect(() => assertPositiveAmount(0)).toThrow(
      "Ledger entry amount must be a positive integer."
    );

    expect(() => assertPositiveAmount(-1)).toThrow(
      "Ledger entry amount must be a positive integer."
    );

    expect(() => assertPositiveAmount(10.5)).toThrow(
      "Ledger entry amount must be a positive integer."
    );
  });

  it("requires at least two ledger entries", () => {
    expect(() =>
      assertBalancedEntries([
        {
          walletAccountId: "wallet_1",
          direction: "DEBIT",
          amountCents: 100,
          currency: "GHS"
        }
      ])
    ).toThrow("Ledger transaction requires at least two entries.");
  });

  it("rejects multi-currency ledger entries", () => {
    expect(() =>
      assertBalancedEntries([
        {
          walletAccountId: "wallet_1",
          direction: "DEBIT",
          amountCents: 100,
          currency: "GHS"
        },
        {
          walletAccountId: "wallet_2",
          direction: "CREDIT",
          amountCents: 100,
          currency: "USD"
        }
      ])
    ).toThrow("Ledger transaction entries must use one currency.");
  });

  it("rejects imbalanced ledger entries", () => {
    expect(() =>
      assertBalancedEntries([
        {
          walletAccountId: "wallet_1",
          direction: "DEBIT",
          amountCents: 100,
          currency: "GHS"
        },
        {
          walletAccountId: "wallet_2",
          direction: "CREDIT",
          amountCents: 99,
          currency: "GHS"
        }
      ])
    ).toThrow("Ledger transaction must balance debits and credits.");
  });

  it("accepts balanced single-currency ledger entries", () => {
    expect(() =>
      assertBalancedEntries([
        {
          walletAccountId: "wallet_1",
          direction: "DEBIT",
          amountCents: 100,
          currency: "GHS"
        },
        {
          walletAccountId: "wallet_2",
          direction: "CREDIT",
          amountCents: 100,
          currency: "GHS"
        }
      ])
    ).not.toThrow();
  });
});
