# ADR 0001: Core Layered Architecture Overview

## Status
Accepted

## Context
DinarFlow requires a secure, high-integrity financial ledger system to process Algerian Dinar (DA) micro-transactions. The system needs to support real-time AML (Anti-Money Laundering) compliance, user onboarding with multi-level KYC, physical agent cash registers, and sub-millisecond telemetry monitoring.

Because DinarFlow must run safely in containerized and sandboxed environments, we need a simple but highly cohesive architectural pattern that decouples presentation from data validation and operational logging.

## Decision
We adopted a layered full-stack architectural pattern:

```
  [ React 18 / Vite Client SPA ]
                 │
                 ▼  (HTTP REST / TLS)
   [ Express Application Server ]
                 │
                 ├─────────────────────────┐
                 ▼                         ▼
      [ Compliance Engine ]         [ Agent Manager ]
                 │                         │
                 ├─────────────────────────┘
                 ▼
      [ Atomic JSON Ledger DB ]
                 │
        (Atomic Local IO)
        [ data/db.json ]
```

### 1. Presentation Layer (React 18 + Vite SPA)
- Highly responsive, fluid user interface structured with a clear dual-mode switch: **Operational Officer Panel** (Admin Mode) and **DinarFlow Client Console** (User Mode).
- Standardized utility state machine powered by **Zustand** for shared telemetry synchronization.

### 2. Services & Business Logic Layer (Express API + Compliance Controller)
- Standardized routes mapping to transaction processing, agent registers, KYC compliance submissions, and sanitization checking.
- Real-time sanctions and threat-modeling checks preceding any database state mutative operation.

### 3. Core Ledger Layer (Atomic JSON database)
- Encapsulated business constraints that enforce the double-entry accounting model, daily limits, and cantonment ratios inside a unified transaction queue.

## Consequences
- **Security**: The UI has zero knowledge of API secret keys; all calls are securely proxied through Express routes.
- **Auditing**: Every service operation, KYC update, or sanction decision fires structured, un-bypassable logs directly to the ledger.
- **Portability**: The entire app compiles into a standalone production server (`dist/server.cjs`) requiring zero relational engine infrastructure, fitting perfectly inside modern lightweight runners.
