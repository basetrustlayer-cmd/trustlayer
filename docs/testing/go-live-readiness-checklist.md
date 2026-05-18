# TrustLayer Go-Live Readiness Checklist

## Product Readiness

- [ ] Identity verification flow validated
- [ ] TrustScore flow validated
- [ ] Fraud graph and fraud alerts validated
- [ ] Wallet ledger validated
- [ ] Escrow lifecycle validated
- [ ] Dispute resolution validated
- [ ] Notifications validated
- [ ] Billing and Stripe validated
- [ ] Developer docs validated
- [ ] Sandbox seed data validated

## Operational Readiness

- [ ] `/health` monitored
- [ ] `/metrics` scraped or manually checked
- [ ] Request IDs present in logs
- [ ] Database backup tested
- [ ] Restore procedure tested
- [ ] Production runbook reviewed
- [ ] Secrets rotated from placeholders
- [ ] Deployment rollback plan documented

## Security Readiness

- [ ] API keys required for protected endpoints
- [ ] Stripe webhook signature verification enabled
- [ ] Webhook signing enabled
- [ ] No raw PII stored in provider metadata
- [ ] No secrets committed
- [ ] GitHub branch protection active
- [ ] CI passing
- [ ] Secret scanning passing

## Commercial Readiness

- [ ] Sandbox demo organization exists
- [ ] API docs page available to partners
- [ ] Example API key flow validated
- [ ] Demo TrustScore subjects available
- [ ] Demo fraud alert available
- [ ] Pricing and billing plans configured
- [ ] First pilot customer onboarding script prepared

## Launch Decision

TrustLayer may go live when:

- [ ] All product readiness checks pass
- [ ] All operational readiness checks pass
- [ ] All security readiness checks pass
- [ ] At least one full E2E test run has been completed
- [ ] Founder approves launch
