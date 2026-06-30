# ADR 0002: State Persistence & Atomic Ledger Mechanics

## Status
Accepted

## Context
In a payment service provider (PSP) system like DinarFlow, maintaining strict ledger integrity is paramount. We must prevent financial race conditions, negative balances, limit violations, and out-of-sync agent records. 

Furthermore, because the application is built on a custom file-based JSON database engine (`server/db.ts`) for extreme low latency, we must implement custom software-level safety protocols to match traditional relational ACID properties.

## Decision
We engineered a secure, atomic transaction engine with the following guarantees:

### 1. Atomic Database Writes
To eliminate data corruption during concurrent writes or sudden container terminations, we utilize a **Write-Ahead Temp File pattern** with atomic OS renaming:
- Every database modification writes to a temporary shadow file (`data/db.json.tmp`).
- Upon successful disk serialization, we trigger a synchronous, atomic move operation (`fs.renameSync`) to swap the temporary file over the active `data/db.json` database.

### 2. Transaction Pre-flight Shields
Before committing any ledger mutation, the database executes three layers of checks:
- **Sanctions & Blacklist Check**: Confirms sender/receiver IBANs, accounts, device fingerprints, and client IPs are not blocked in the fraud blacklist.
- **Overdraft Shield**: Ensures the sender's current balance exceeds the transaction amount plus calculated service fees.
- **KYC Balance Cap & Limits**: Verifies the transaction amount does not exceed the sender's daily debit limits or the receiver's KYC-level balance caps (e.g., max 100,000 DA for KYC Level 1).

### 3. Cantonment Check
The system logs a complete, double-entry alignment matching the total user liabilities (sum of all user balances) against the physical bank guarantee issued by the partner bank. If there is a deficit, security alerts are generated in the Reconciliation Tab.

### 4. Fee & Regulatory Splits
Every transfer applies a **0.5% fee (capped at 1000 DA)**, split precisely into:
- **Regulatory Fee (0.1%)**: Auditing & reporting overhead.
- **Operational Fee (0.2%)**: Network routing and packet maintenance.
- **Profit Margin (0.2%)**: PSP system revenue.

## Consequences
- **Performance**: High-speed, microsecond local file verification.
- **Data Safety**: Zero half-written JSON data files if a power loss or process kill happens mid-write.
- **Auditability**: Every fee calculation and debit event maps to a physical double-entry ledger event.
