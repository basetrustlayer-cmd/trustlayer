# TrustLayer Frontend Route Map

## Public Trust Entity Journey

| Route | Purpose |
|---------|---------|
| /entity | Trust Entity home |
| /entity/verification | Verification workflow |
| /entity/trustscore | TrustScore center |
| /entity/badge | Trust Badge center |
| /entity/profile | Public trust profile |

---

## Integrator Journey

| Route | Purpose |
|---------|---------|
| /integrators | Integrator portal home |
| /integrators/trial | Trial command center |
| /integrators/developer | API key & SDK center |
| /integrators/production | Production activation |
| /integrators/billing | Billing & subscriptions |
| /integrators/analytics | Usage analytics |
| /integrators/webhooks | Webhook monitor |

---

## API Exploration

| Route | Purpose |
|---------|---------|
| /integrators/explorer | Verification API |
| /integrators/trustscore | TrustScore API |
| /integrators/badges | Badge API |
| /integrators/registry | Trust Registry API |
| /integrators/playground | SDK playground |

---

## Administrative Operations

| Route | Purpose |
|---------|---------|
| /integrators/admin | Integrator administration |
| /verification-review | Verification review console |

---

## Shared Architecture

### Design System

```txt
apps/dashboard/components/trustlayer
```

### Domain Models

```txt
packages/shared-types/src/domain
```

### Mock Data

```txt
packages/shared-types/src/mock
```

### Repository Layer

```txt
packages/shared-types/src/repositories
```

---

## Business Model

### Trust Entities

- Free
- Verification
- TrustScore
- Trust Badge
- Public Profile

### Integrators

- Paid
- SDK
- APIs
- Webhooks
- Production Access
- Billing

---

## Current Architecture

```txt
Pages
  ↓
Repositories
  ↓
Mock Data
  ↓
Domain Models
```

Target:

```txt
Pages
  ↓
Repositories
  ↓
Database / APIs
  ↓
Domain Models
```
