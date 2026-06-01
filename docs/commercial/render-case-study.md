# Render x TrustLayer: Case Study

**Integration type:** Projection-only consumer (boundary model)
**Sprint cycles to production:** 12
**Status:** Live — pilot integration

---

## The Problem

Render is a zero-commission marketplace connecting buyers and sellers in Ghana.
Zero commission means zero margin for fraud absorption. Every disputed transaction,
every identity mismatch, every bad actor who slips through degrades the marketplace
unit economics directly.

Before TrustLayer, Render had no systematic way to answer the question every
marketplace must answer before a transaction clears: can this counterparty be trusted?

The options available to Render at launch were:
- Build their own identity verification pipeline (6-12 months, significant compliance exposure)
- Use a consumer credit bureau (no coverage for informal economy participants)
- Rely on social proof alone (unscalable, gameable)

None of these were viable for a zero-commission model targeting Ghana's informal
and semi-formal commerce sector.

---

## The Solution

TrustLayer positioned itself as neutral infrastructure — the trust layer Render
licenses rather than builds. The integration model was deliberately constrained:

**Render is a projection-only consumer.**

This means Render reads TrustScore and tier data from TrustLayer but does not
write trust events back. TrustLayer maintains the canonical trust state;
Render projects it into its marketplace UI. This boundary model has three
strategic properties:

1. Render cannot corrupt the trust graph. A bad actor cannot inflate their
   score by gaming Render's own transaction data.
2. TrustLayer's data remains portable. A subject's score is valid across
   all TrustLayer consumers, not locked to Render's ecosystem.
3. The integration is thin. Render's engineering team integrated in days,
   not months, using the @trustlayer/sdk client.

---

## Integration Architecture

Render Marketplace calls:
- GET /v1/score/:subjectId  (seller trust display)
- GET /v1/tier/:subjectId   (buyer eligibility gate)
- POST /v1/escrow/intent    (SafeDeal hold)
- Webhook: trust_score.updated -> cache invalidation

TrustLayer maintains:
- Subject.verificationTier (Ghana Card / ORC)
- TrustScore (weighted factor model)
- consumerTier (UNVERIFIED / BASIC / VERIFIED / ENHANCED)
- projectionTtlSeconds (cache freshness instruction)

---

## SLO Commitments

| SLO | Target | Measurement |
|-----|--------|-------------|
| Score endpoint p99 latency | < 200ms | Rolling 7-day |
| Webhook delivery | < 30s from event | Per-event timestamp |
| Verification session completion | < 5 min | OTP initiate to confirm |
| API availability | 99.5% | Monthly |

projectionTtlSeconds is returned on every score response, instructing
Render's cache layer how long a projection remains valid before re-fetch.

---

## SafeDeal Flow

1. Buyer initiates purchase
2. TrustLayer: POST /v1/escrow/intent
   - Verifies buyer consumerTier >= BASIC
   - Verifies seller consumerTier >= VERIFIED
   - Creates EscrowHold
3. Render displays SafeDeal Protected badge
4. Goods/services delivered
5. Buyer confirms -> TrustLayer releases escrow to seller
6. TrustScore recalculated for both counterparties (reason: escrow.released)

If disputed: Render opens POST /v1/disputes, TrustLayer manages evidence
and resolution, outcome reflected in both counterparties' TrustScores.

---

## Proof Points

- 12 sprint cycles from zero to production-grade integration
- 4 verification tiers live (UNVERIFIED / INDIVIDUAL / BUSINESS / ENHANCED)
- Zero handwritten types — @trustlayer/sdk eliminates vocabulary drift
- Webhook freshness enforced via projectionTtlSeconds
- SafeDeal operational — hold, release, and dispute resolution live

---

## Commercial Narrative

TrustLayer is the trust layer for African commerce.

Render's integration proves the thesis. A marketplace with zero margin for
fraud absorption launched with identity verification, trust scoring, escrow
protection, and dispute resolution — none of which Render built.

TrustLayer is not a feature. It is infrastructure. The same way Render does
not build its own payments processor, it does not build its own trust layer.
It licenses one.

This is the Stripe model applied to trust:
- Stripe abstracted payment processors. TrustLayer abstracts trust pipelines.
- Every marketplace entering Ghana faces the same problem Render faced.
- TrustLayer is already the answer.

---

## Next Steps

- Skillpost pilot: labour marketplace (worker verification, hirer trust scoring)
- ECOWAS expansion: Nigeria, Cote d'Ivoire, Senegal, Kenya
- External API launch: targeting Series A milestone

---

Document version: 1.0 | Effective: 2026-05-18 | Owner: TrustLayer Commercial
