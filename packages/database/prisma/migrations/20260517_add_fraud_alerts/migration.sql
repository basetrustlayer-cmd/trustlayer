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
