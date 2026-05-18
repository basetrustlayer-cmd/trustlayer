# TrustLayer End-to-End Test Cases

## 1. Health and Metrics

### Steps

1. Call `GET /health`
2. Call `GET /metrics`

### Expected

- `/health` returns `{ "status": "ok", "service": "trustlayer-api-gateway" }`
- `/metrics` returns Prometheus-compatible text
- Response headers include `X-Request-ID`

## 2. Verification and TrustScore Flow

### Steps

1. Submit `POST /v1/verify`
2. Confirm `VerificationSession` is created
3. Confirm `Subject.verificationTier` updates
4. Confirm TrustScore is persisted
5. Fetch `GET /v1/tier/{subjectId}`
6. Fetch `GET /v1/score/{subjectId}`

### Expected

- Verification status is `VERIFIED` or `OTP_SENT`
- Tier is no longer stale
- TrustScore exists for the subject
- Score response matches OpenAPI contract

## 3. API Key Flow

### Steps

1. Create billing plan with API access
2. Create organization subscription
3. Create platform API key
4. Call protected endpoint with `X-API-Key`

### Expected

- API key is created once with plaintext value returned
- Protected endpoint accepts valid key
- Protected endpoint rejects missing or invalid key

## 4. Marketplace Reputation Flow

### Steps

1. Submit transaction
2. Submit review
3. Submit dispute
4. Fetch score history
5. Fetch leaderboard

### Expected

- Transaction, review, and dispute records are created
- TrustScore recalculates
- Score history records reasons
- Leaderboard includes qualified subjects

## 5. Fraud Monitoring Flow

### Steps

1. Seed or create high-risk subject
2. Call `GET /v1/fraud-graph/{subjectId}/risk`
3. List fraud alerts
4. Resolve fraud alert

### Expected

- Risk endpoint returns analytics
- High-risk graph result creates alert
- Alert appears in `/v1/fraud-alerts`
- Resolve endpoint marks alert as `RESOLVED`

## 6. Wallet and Escrow Flow

### Steps

1. Create buyer available wallet
2. Create seller available wallet
3. Post balanced ledger transaction
4. Create escrow hold
5. Release escrow with optional platform fee
6. Verify balances

### Expected

- Ledger transaction rejects unbalanced entries
- Escrow hold creates balanced entries
- Release sends funds to seller and platform fee account if applicable
- Balances reflect double-entry accounting

## 7. Dispute Resolution Flow

### Steps

1. Open dispute-resolution case
2. Add evidence
3. Resolve dispute
4. Confirm escrow action

### Expected

- Case moves from `OPEN` to `UNDER_REVIEW`
- Evidence is stored in metadata
- Resolution updates dispute
- Escrow release or cancel occurs when required

## 8. Notification Flow

### Steps

1. Send notification with `EVENT_BUS` and `IN_APP`
2. Confirm event is published or logged
3. Confirm in-app notification or event log exists

### Expected

- Notification accepted
- No channel silently fails without log evidence
- Event IDs are traceable

## 9. Billing and Stripe Flow

### Steps

1. Create Stripe checkout session
2. Complete payment in Stripe test mode
3. Receive webhook
4. Confirm subscription status updates

### Expected

- Checkout URL is created
- Webhook signature is validated
- Subscription status becomes `ACTIVE`

## 10. Backup and Restore

### Steps

1. Run backup script
2. Confirm SQL file exists
3. Restore into staging test database

### Expected

- Backup completes without error
- Restore completes without error
- Application starts after restore
