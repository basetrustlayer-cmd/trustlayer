# TrustLayer Pre-Launch Verification Protocol

## 1. Source Control
- [ ] Working tree clean
- [ ] All feature branches merged into main
- [ ] Branch protection enabled
- [ ] Required reviews enabled
- [ ] Required status checks enabled

## 2. Automated Validation
- [ ] pnpm install
- [ ] pnpm build
- [ ] pnpm test
- [ ] pnpm typecheck
- [ ] pnpm openapi:lock

## 3. API Contract Validation
- [ ] Dredd contract tests pass
- [ ] GET /v1/score validated
- [ ] Marketplace endpoints validated
- [ ] Dispute resolution endpoints validated

## 4. Database
- [ ] Prisma schema validates
- [ ] Migrations apply successfully
- [ ] Seed data loads
- [ ] Referential integrity confirmed

## 5. Trust Scoring
- [ ] Single score retrieval verified
- [ ] Aggregate score retrieval verified
- [ ] Score history retrieval verified
- [ ] Inactivity decay verified

## 6. Financial Integrity
- [ ] Ledger entries balance to zero
- [ ] Escrow hold verified
- [ ] Escrow release verified
- [ ] Escrow cancellation verified
- [ ] Platform fee accounting verified

## 7. Fraud Detection
- [ ] Shared phone high-risk detection verified
- [ ] Risk score classification verified
- [ ] Fraud alerts generated

## 8. Dispute Resolution
- [ ] Open dispute
- [ ] Add evidence
- [ ] Resolve dispute
- [ ] Escrow action executed

## 9. Webhooks and Notifications
- [ ] Event bus publication verified
- [ ] Webhook deliveries queued
- [ ] In-app notifications generated

## 10. Security
- [ ] Secrets not committed
- [ ] gitleaks passes
- [ ] API key authentication verified
- [ ] Row-level security verified

## 11. Production Readiness
- [ ] Health endpoints operational
- [ ] OpenAPI documentation current
- [ ] Monitoring configured
- [ ] Backup strategy documented

## 12. Launch Approval
- [ ] Technical lead sign-off
- [ ] Product sign-off
- [ ] Security sign-off
- [ ] CEO approval

Status: APPROVED FOR EXTERNAL INTEGRATION
