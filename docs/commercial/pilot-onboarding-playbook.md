# TrustLayer Pilot Customer Onboarding Playbook

## Purpose

Help the first pilot customer integrate TrustLayer in a controlled sandbox-to-production path.

## Ideal Pilot Customer

- Marketplace, fintech, gig platform, procurement platform, lender, or B2B commerce platform
- Has recurring user/vendor onboarding
- Needs identity, business verification, fraud risk, TrustScore, badges, escrow, or dispute workflows
- Can assign one business sponsor and one technical contact

## Pilot Timeline

### Week 1: Discovery and Sandbox Setup

- Confirm use case
- Identify subject types: buyer, seller, vendor, worker, business, platform
- Create sandbox organization
- Create API key
- Load sandbox data
- Review API docs

### Week 2: Technical Integration

- Integrate `/v1/verify`
- Integrate `/v1/score/{subjectId}`
- Submit sample transactions, reviews, and disputes
- Validate webhook handling
- Validate fraud alert workflow

### Week 3: Business Workflow Validation

- Review TrustScore thresholds
- Validate badge eligibility
- Validate fraud escalation
- Validate escrow and dispute lifecycle if applicable
- Review dashboard/admin workflow

### Week 4: Production Decision

- Confirm success metrics
- Review pricing
- Approve production rollout
- Rotate production credentials
- Sign commercial agreement

## Pilot Success Metrics

- Verification completion rate
- Reduction in manual review time
- Fraud alerts generated and resolved
- TrustScore coverage across active subjects
- API uptime during pilot
- Integration time to first successful verification
- Pilot stakeholder approval

## Required Customer Inputs

- Company name
- Platform URL
- Technical contact
- Billing contact
- Expected monthly verification volume
- Countries supported
- Subject types
- Current verification workflow
- Current fraud or dispute pain points

## Internal TrustLayer Setup

- Create organization
- Create subscription plan
- Create platform
- Generate API key
- Enable sandbox access
- Enable relevant services
- Confirm API docs access
- Schedule weekly check-in

## Pilot Exit Criteria

Pilot is successful when:

- Customer completes one full E2E verification flow
- TrustScore is generated and retrieved
- Webhook or event flow is validated
- Customer confirms value
- Commercial rollout path is agreed
