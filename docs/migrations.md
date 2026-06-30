# DinarFlow Database Migrations & Schema Evolution

DinarFlow utilizes an encapsulated JSON file database (`data/db.json`) as its primary ledger and telemetry repository. This document describes the schema structure, the programmatic mechanism used for schema migrations, and a transition roadmap for migrating to Cloud SQL (PostgreSQL).

---

## 1. JSON Database Structure

The JSON database maintains the following root collections:

```json
{
  "accounts": [],
  "transactions": [],
  "agents": [],
  "cantonmentRecords": [],
  "guarantee": {},
  "auditLogs": [],
  "totpSecrets": {},
  "commissionSettlements": [],
  "guaranteeRenewals": [],
  "deviceFingerprints": [],
  "blockedEntities": [],
  "trustedBeneficiaries": [],
  "heldTransactions": [],
  "swiftMessages": [],
  "multiSigTransactions": [],
  "failedTransactionRetries": [],
  "complianceReports": [],
  "complianceDecisions": []
}
```

---

## 2. Programmatic Schema Migrations

To maintain compatibility as new features are added, the database engine implements a **runtime-based migration hook**. 

### How it works:
When the server boots, the `JSONDatabase` class (defined in `server/db.ts`) loads the current contents of `db.json`. It runs the `validateAndMigrateSchema()` function which checks for missing attributes or tables, sets safe defaults, and saves the corrected database state atomically.

### Migration Hook Implementation Pattern:
```typescript
private validateAndMigrateSchema() {
  let migrated = false;

  // Example migration: Initialize trustedBeneficiaries collection if missing
  if (!this.data.trustedBeneficiaries) {
    this.data.trustedBeneficiaries = [];
    migrated = true;
  }

  // Example migration: Populate default parameters on existing records
  this.data.accounts.forEach(account => {
    if (account.dailyDebitLimit === undefined) {
      account.dailyDebitLimit = account.kycLevel === 1 ? 100000 : 500000;
      migrated = true;
    }
  });

  if (migrated) {
    this.saveData(); // Commit schema updates atomically
  }
}
```

---

## 3. Relational Database Migration Roadmap (PostgreSQL / Cloud SQL)

As transaction volumes scale, DinarFlow should transition from the local JSON database to a high-availability relational SQL database (Cloud SQL / PostgreSQL) using **Drizzle ORM**.

### Step 1: Mapping Collections to SQL Tables
We map the JSON structure to normalized relational tables:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│            accounts             │       │          transactions           │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id (PK, UUID)                   │◄─────┐│ id (PK, UUID)                   │
│ name (VARCHAR)                  │      ││ sender_id (FK, UUID)            │
│ email (VARCHAR, UNIQUE)         │      ││ receiver_id (FK, UUID)          │
│ iban (VARCHAR, UNIQUE)           │      ││ amount (NUMERIC)                │
│ balance (NUMERIC)               │      ││ fee (NUMERIC)                   │
│ kyc_level (INTEGER)             │      ││ reference (TEXT)                │
│ kyc_status (VARCHAR)            │      ││ timestamp (TIMESTAMP)           │
└─────────────────────────────────┘      └─────────────────────────────────┘
```

### Step 2: Drizzle ORM Schema Setup
An example of the equivalent Drizzle schema definition (`src/db/schema.ts`):

```typescript
import { pgTable, uuid, varchar, integer, numeric, timestamp, text } from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  kycLevel: integer('kyc_level').default(1).notNull(),
  kycStatus: varchar('kyc_status', { length: 50 }).default('ACTIVE').notNull(),
  balance: numeric('balance', { precision: 15, scale: 2 }).default('0').notNull(),
  iban: varchar('iban', { length: 34 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderIban: varchar('sender_iban', { length: 34 }).notNull(),
  receiverIban: varchar('receiver_iban', { length: 34 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  fee: numeric('fee', { precision: 15, scale: 2 }).default('0').notNull(),
  reference: text('reference').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});
```

### Step 3: Scripted Data Migration Pipeline
A migration script (`scripts/migrate-json-to-postgres.ts`) loads the JSON backup file and streams records using SQL bulk insertions:

```typescript
import { db } from './postgres-client';
import { accounts, transactions } from '../src/db/schema';
import fs from 'fs';

async function runDataMigration() {
  const fileContent = fs.readFileSync('data/db.json', 'utf8');
  const jsonData = JSON.parse(fileContent);

  console.log(`Starting migration of ${jsonData.accounts.length} accounts...`);
  
  for (const account of jsonData.accounts) {
    await db.insert(accounts).values({
      id: account.id,
      name: account.name,
      email: account.email,
      phoneNumber: account.phoneNumber,
      kycLevel: account.kycLevel,
      kycStatus: account.kycStatus,
      balance: account.balance.toString(),
      iban: account.iban,
      createdAt: new Date(account.createdAt)
    });
  }
  
  console.log("Database Migration Complete!");
}
```
