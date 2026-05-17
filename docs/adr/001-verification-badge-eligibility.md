# ADR 001: Verification Session and Badge Eligibility Source of Truth

## Status

Accepted

## Context

TrustLayer currently has two verification-related concepts:

1. `VerificationRequest`
   - Dashboard/admin workflow for document review and certification operations.
   - Tied to an organization and uploaded documents.
   - Useful for internal review, admin approval, and historical evidence.

2. `VerificationSession`
   - API/KYC workflow for identity and business verification.
   - Tied directly to a `Subject`.
   - Produced by the KYC orchestrator through methods such as `PHONE_OTP`, `GHANA_CARD`, `BVN`, `NIN`, and `BUSINESS_ORC`.

The Living Gap Document identified a design conflict because certification and public badge eligibility could drift if they depend only on `VerificationRequest`, while B2B API verification depends on `VerificationSession`.

## Decision

`Subject.verificationTier` is the canonical verification source of truth for platform trust status.

Badge and certificate eligibility must be based on:

- `Subject.verificationTier >= INDIVIDUAL`
- active/current `TrustScore.score >= 70`
- credential lifecycle rules such as expiration and renewal windows

`VerificationSession` remains the canonical evidence trail for how a subject reached a tier.

`VerificationRequest` remains a dashboard/admin document workflow and should not be the sole source of truth for public badge eligibility.

## Consequences

### Positive

- B2B API verification and public badge eligibility use the same trust foundation.
- External provider verification can immediately affect eligibility.
- Dashboard review remains useful without blocking API-native integrations.
- Future KYC methods can improve `verificationTier` without requiring document-review duplication.

### Tradeoffs

- Badge and certificate pages may need refactoring where they depend directly on `VerificationRequest`.
- Admin workflows must display both document-review status and subject verification tier clearly.
- Historical badge decisions should store enough metadata to explain why a badge was valid at issuance.

## Implementation Rule

Any badge, certificate, or public verification route should evaluate eligibility from:

1. `Subject.verificationTier`
2. current TrustScore
3. credential lifecycle/expiration policy

Document-review status from `VerificationRequest` may be shown as supporting evidence, but it must not override the canonical subject tier unless an admin action explicitly updates `Subject.verificationTier`.

## Migration Guidance

Existing badge/certificate routes should be reviewed and gradually changed from:

VerificationRequest.status === APPROVED

to:

Subject.verificationTier in [INDIVIDUAL, BUSINESS, ENHANCED]
AND TrustScore.score >= 70

## Open Follow-Up

A future implementation ticket should refactor dashboard badge and public verification routes to enforce this ADR directly in code.
