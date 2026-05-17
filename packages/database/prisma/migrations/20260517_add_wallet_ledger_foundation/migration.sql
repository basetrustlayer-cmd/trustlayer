CREATE TABLE "WalletAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "subjectId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "type" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "ledgerTransactionId" TEXT NOT NULL,
    "walletAccountId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EscrowHold" (
    "id" TEXT NOT NULL,
    "buyerSubjectId" TEXT NOT NULL,
    "sellerSubjectId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "reference" TEXT NOT NULL,
    "metadata" JSONB,
    "releasedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowHold_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WalletAccount_organizationId_idx" ON "WalletAccount"("organizationId");
CREATE INDEX "WalletAccount_subjectId_idx" ON "WalletAccount"("subjectId");
CREATE UNIQUE INDEX "WalletAccount_organizationId_subjectId_currency_type_key" ON "WalletAccount"("organizationId", "subjectId", "currency", "type");

CREATE UNIQUE INDEX "LedgerTransaction_reference_key" ON "LedgerTransaction"("reference");
CREATE INDEX "LedgerTransaction_type_createdAt_idx" ON "LedgerTransaction"("type", "createdAt");
CREATE INDEX "LedgerTransaction_status_createdAt_idx" ON "LedgerTransaction"("status", "createdAt");

CREATE INDEX "LedgerEntry_walletAccountId_createdAt_idx" ON "LedgerEntry"("walletAccountId", "createdAt");
CREATE INDEX "LedgerEntry_ledgerTransactionId_idx" ON "LedgerEntry"("ledgerTransactionId");

CREATE UNIQUE INDEX "EscrowHold_reference_key" ON "EscrowHold"("reference");
CREATE INDEX "EscrowHold_buyerSubjectId_idx" ON "EscrowHold"("buyerSubjectId");
CREATE INDEX "EscrowHold_sellerSubjectId_idx" ON "EscrowHold"("sellerSubjectId");
CREATE INDEX "EscrowHold_status_createdAt_idx" ON "EscrowHold"("status", "createdAt");

ALTER TABLE "WalletAccount"
ADD CONSTRAINT "WalletAccount_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletAccount"
ADD CONSTRAINT "WalletAccount_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry"
ADD CONSTRAINT "LedgerEntry_ledgerTransactionId_fkey"
FOREIGN KEY ("ledgerTransactionId") REFERENCES "LedgerTransaction"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry"
ADD CONSTRAINT "LedgerEntry_walletAccountId_fkey"
FOREIGN KEY ("walletAccountId") REFERENCES "WalletAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
