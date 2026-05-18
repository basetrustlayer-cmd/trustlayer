-- Enable and enforce Row Level Security on AuditLog.
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auditlog_org_isolation ON "AuditLog";

-- Application code must set app.current_organization_id before tenant-scoped reads/writes.
CREATE POLICY auditlog_org_isolation
ON "AuditLog"
FOR ALL
USING (
  "organizationId" = current_setting('app.current_organization_id', true)
)
WITH CHECK (
  "organizationId" = current_setting('app.current_organization_id', true)
);
