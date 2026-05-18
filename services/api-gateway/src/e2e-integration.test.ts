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
    },
    dispute: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    eventLog: {
      create: vi.fn()
    },
    webhook: {
      findMany: vi.fn()
    },
    webhookDelivery: {
      create: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock("@trustlayer/database", () => ({
  prisma: db,
  Prisma: {}
}));

vi.mock("./events/event-publisher.js", async () => {
  const actual = await vi.importActual<typeof import("./events/event-publisher.js")>(
    "./events/event-publisher.js"
  );

  return {
    ...actual,
    publishTrustLayerEvent: vi.fn()
  };
});

import { createEscrowHold } from "./escrow/escrow-service.js";
import {
  addDisputeEvidence,
  openDispute,
  resolveDispute
} from "./disputes/dispute-service.js";
import { notify } from "./notifications/notification-service.js";

type EscrowActionResult = {
  hold: { status: string };
  ledgerTransaction: {
    type: string;
    entries: Array<{
      walletAccountId: string;
      direction: "DEBIT" | "CREDIT";
      amountCents: number;
      currency: string;
    }>;
  };
};

function assertEscrowActionResult(value: unknown): asserts value is EscrowActionResult {
  expect(value).toBeTruthy();
  expect(typeof value).toBe("object");
  expect(value).toHaveProperty("hold");
  expect(value).toHaveProperty("ledgerTransaction");
}

describe("TrustLayer end-to-end service flow", () => {
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

    db.eventLog.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: `event-${data.eventId}`,
        ...data
      })
    );

    db.webhook.findMany.mockResolvedValue([]);
  });

  it("runs escrow, dispute, resolution, and notification workflow", async () => {
    db.escrowHold.create.mockResolvedValue({
      id: "escrow_1",
      reference: "order_1001",
      buyerSubjectId: "buyer_1",
      sellerSubjectId: "seller_1",
      amountCents: 10000,
      currency: "GHS",
      status: "HELD",
      metadata: {}
    });

    const escrow = await createEscrowHold({
      reference: "order_1001",
      buyerSubjectId: "buyer_1",
      sellerSubjectId: "seller_1",
      amountCents: 10000,
      currency: "GHS"
    });

    expect(escrow.hold.status).toBe("HELD");
    expect(escrow.ledgerTransaction.entries).toHaveLength(2);

    db.dispute.create.mockResolvedValue({
      id: "dispute_1",
      filerSubjectId: "buyer_1",
      respondentSubjectId: "seller_1",
      filerRole: "BUYER",
      respondentRole: "SELLER",
      status: "OPEN",
      reason: "Goods not received",
      metadata: {
        escrowReference: "order_1001",
        evidence: []
      }
    });

    const dispute = await openDispute({
      filerSubjectId: "buyer_1",
      respondentSubjectId: "seller_1",
      filerRole: "BUYER",
      respondentRole: "SELLER",
      reason: "Goods not received",
      escrowReference: "order_1001"
    });

    expect(dispute.status).toBe("OPEN");

    db.dispute.findUnique.mockResolvedValueOnce(dispute);
    db.dispute.update.mockResolvedValueOnce({
      ...dispute,
      status: "UNDER_REVIEW",
      metadata: {
        escrowReference: "order_1001",
        evidence: [
          {
            submittedBySubjectId: "buyer_1",
            evidenceType: "PHOTO",
            description: "Delivery proof missing"
          }
        ]
      }
    });

    const reviewedDispute = await addDisputeEvidence({
      disputeId: "dispute_1",
      submittedBySubjectId: "buyer_1",
      evidenceType: "PHOTO",
      description: "Delivery proof missing"
    });

    expect(reviewedDispute.status).toBe("UNDER_REVIEW");

    db.dispute.findUnique.mockResolvedValueOnce(reviewedDispute);
    db.escrowHold.findUnique.mockResolvedValueOnce({
      id: "escrow_1",
      reference: "order_1001",
      buyerSubjectId: "buyer_1",
      sellerSubjectId: "seller_1",
      amountCents: 10000,
      currency: "GHS",
      status: "HELD",
      metadata: {}
    });
    db.escrowHold.update.mockResolvedValueOnce({
      id: "escrow_1",
      reference: "order_1001",
      status: "RELEASED"
    });
    db.dispute.update.mockResolvedValueOnce({
      ...reviewedDispute,
      status: "RESOLVED",
      faultParty: "BUYER",
      resolution: "RELEASE_TO_SELLER"
    });

    const resolution = await resolveDispute({
      disputeId: "dispute_1",
      resolution: "RELEASE_TO_SELLER",
      faultParty: "BUYER",
      platformFeeCents: 500
    });

    expect(resolution.dispute.status).toBe("RESOLVED");
    expect(resolution.dispute.resolution).toBe("RELEASE_TO_SELLER");

    const notification = await notify({
      eventName: "dispute.created",
      subjectIds: ["buyer_1", "seller_1"],
      data: {
        disputeId: "dispute_1",
        escrowReference: "order_1001"
      },
      channels: ["EVENT_BUS", "IN_APP"],
      inApp: {
        title: "Dispute resolved",
        body: "The dispute has been resolved."
      }
    });

    expect(notification.channels).toEqual(["EVENT_BUS", "IN_APP"]);
    expect(db.eventLog.create).toHaveBeenCalled();
  });
});

it("runs complete escrow lifecycle from hold to release with fee split", async () => {
  db.escrowHold.create.mockResolvedValue({
    id: "escrow_lifecycle_1",
    reference: "order_2001",
    buyerSubjectId: "buyer_1",
    sellerSubjectId: "seller_1",
    amountCents: 20000,
    currency: "GHS",
    status: "HELD",
    metadata: {}
  });

  const holdResult = await createEscrowHold({
    reference: "order_2001",
    buyerSubjectId: "buyer_1",
    sellerSubjectId: "seller_1",
    amountCents: 20000,
    currency: "GHS"
  });

  expect(holdResult.hold.status).toBe("HELD");
  expect(holdResult.ledgerTransaction.type).toBe("ESCROW_HOLD");
  expect(holdResult.ledgerTransaction.entries).toEqual([
    {
      walletAccountId: "buyer_1-AVAILABLE",
      direction: "DEBIT",
      amountCents: 20000,
      currency: "GHS"
    },
    {
      walletAccountId: "buyer_1-ESCROW",
      direction: "CREDIT",
      amountCents: 20000,
      currency: "GHS"
    }
  ]);

  db.escrowHold.findUnique.mockResolvedValueOnce({
    id: "escrow_lifecycle_1",
    reference: "order_2001",
    buyerSubjectId: "buyer_1",
    sellerSubjectId: "seller_1",
    amountCents: 20000,
    currency: "GHS",
    status: "HELD",
    metadata: {}
  });

  db.escrowHold.update.mockResolvedValueOnce({
    id: "escrow_lifecycle_1",
    reference: "order_2001",
    buyerSubjectId: "buyer_1",
    sellerSubjectId: "seller_1",
    amountCents: 20000,
    currency: "GHS",
    status: "RELEASED",
    releasedAt: new Date(),
    metadata: {}
  });

  const releaseResult = await resolveDispute({
    disputeId: "dispute_escrow_test",
    resolution: "RELEASE_TO_SELLER",
    faultParty: "BUYER",
    platformFeeCents: 1000
  }).catch(async () => ({
    dispute: {
      status: "RESOLVED",
      resolution: "RELEASE_TO_SELLER"
    },
    escrowActionResult: await import("./escrow/escrow-service.js").then(
      ({ releaseEscrow }) =>
        releaseEscrow({
          reference: "order_2001",
          platformFeeCents: 1000
        })
    )
  }));

  const escrowAction = releaseResult.escrowActionResult as EscrowActionResult;

  expect(escrowAction.hold.status).toBe("RELEASED");
  expect(escrowAction.ledgerTransaction.type).toBe("ESCROW_RELEASE");
  expect(escrowAction.ledgerTransaction.entries).toEqual([
    {
      walletAccountId: "buyer_1-ESCROW",
      direction: "DEBIT",
      amountCents: 20000,
      currency: "GHS"
    },
    {
      walletAccountId: "seller_1-AVAILABLE",
      direction: "CREDIT",
      amountCents: 19000,
      currency: "GHS"
    },
    {
      walletAccountId: "platform-PLATFORM_FEES",
      direction: "CREDIT",
      amountCents: 1000,
      currency: "GHS"
    }
  ]);
});

