DO $$ BEGIN
    CREATE TYPE "SubjectType" AS ENUM ('INDIVIDUAL', 'BUSINESS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "VerificationMethod" AS ENUM ('PHONE_OTP', 'GHANA_CARD', 'BVN', 'NIN', 'BUSINESS_ORC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "IdentityVerificationStatus" AS ENUM ('OTP_SENT', 'VERIFIED', 'FAILED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Subject" (
    "id" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'GH',
    "verificationTier" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "tierUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Subject_externalId_idx" ON "Subject"("externalId");

CREATE TABLE IF NOT EXISTS "VerificationSession" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "method" "VerificationMethod" NOT NULL,
    "status" "IdentityVerificationStatus" NOT NULL,
    "registryResponse" JSONB,
    "tierBefore" TEXT,
    "tierAfter" TEXT,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VerificationSession_subjectId_createdAt_idx" ON "VerificationSession"("subjectId", "createdAt");

ALTER TABLE "VerificationSession"
ADD CONSTRAINT "VerificationSession_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FraudAlert" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'trust_score',
    "metadata" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FraudAlert_subjectId_createdAt_idx" ON "FraudAlert"("subjectId", "createdAt");
CREATE INDEX "FraudAlert_status_severity_idx" ON "FraudAlert"("status", "severity");

ALTER TABLE "FraudAlert"
ADD CONSTRAINT "FraudAlert_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
