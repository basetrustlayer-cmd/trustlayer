CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventLog_eventId_key" ON "EventLog"("eventId");
CREATE INDEX "EventLog_topic_createdAt_idx" ON "EventLog"("topic", "createdAt");
CREATE INDEX "EventLog_status_createdAt_idx" ON "EventLog"("status", "createdAt");
