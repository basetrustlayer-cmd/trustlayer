import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getOrCreateWalletAccount,
  getWalletBalance,
  postLedgerTransaction
} from "../wallet/ledger-service.js";

const walletAccountSchema = z.object({
  organizationId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  currency: z.string().min(3).max(3).default("GHS"),
  type: z.enum(["AVAILABLE", "ESCROW", "PLATFORM_FEES"]).default("AVAILABLE")
});

const walletBalanceParamsSchema = z.object({
  id: z.string().min(1)
});

const ledgerEntrySchema = z.object({
  walletAccountId: z.string().min(1),
  direction: z.enum(["DEBIT", "CREDIT"]),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3)
});

const ledgerTransactionSchema = z.object({
  reference: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  entries: z.array(ledgerEntrySchema).min(2)
});

export async function registerWalletRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/wallet/accounts", async (request, reply) => {
    const parsed = walletAccountSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid wallet account request",
        issues: parsed.error.flatten()
      });
    }

    const account = await getOrCreateWalletAccount(parsed.data);

    return reply.status(201).send(account);
  });

  app.get("/v1/wallet/accounts/:id/balance", async (request, reply) => {
    const params = walletBalanceParamsSchema.parse(request.params);
    const balance = await getWalletBalance(params.id);

    return reply.status(200).send(balance);
  });

  app.post("/v1/wallet/transactions", async (request, reply) => {
    const parsed = ledgerTransactionSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid ledger transaction request",
        issues: parsed.error.flatten()
      });
    }

    try {
      const transaction = await postLedgerTransaction(parsed.data);
      return reply.status(201).send(transaction);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Ledger transaction failed"
      });
    }
  });
}
