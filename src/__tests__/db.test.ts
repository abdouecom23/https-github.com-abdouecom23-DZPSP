import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock 'fs' module completely before importing the db
vi.mock('fs', () => {
  const store: Record<string, string> = {};
  return {
    default: {
      existsSync: vi.fn((p: string) => {
        return p.endsWith('.tmp') ? !!store[p] : true;
      }),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn((p: string) => {
        return store[p] || '{"accounts":[],"transactions":[],"agents":[],"cantonmentRecords":[],"guarantee":{"id":"g-1","amount":50000000,"issueDate":"2025-06-01","expiryDate":"2026-09-15","status":"ACTIVE"},"auditLogs":[]}';
      }),
      writeFileSync: vi.fn((p: string, data: string) => {
        store[p] = data;
      }),
      renameSync: vi.fn((src: string, dest: string) => {
        store[dest] = store[src];
        delete store[src];
      }),
    }
  };
});

import { db, generateAlgerianIBAN } from '../../server/db';

describe('JSONDatabase', () => {
  beforeEach(() => {
    // Reset DB data manually to have a predictable test environment
    const testAccounts = [
      {
        id: 'acc-1',
        name: 'Sofiane Brahimi',
        email: 'sofiane.b@gmail.com',
        phoneNumber: '0550123456',
        kycLevel: 1,
        kycStatus: 'ACTIVE' as const,
        balance: 45000,
        iban: generateAlgerianIBAN(1),
        dailyDebitSum: 0,
        dailyDebitLimit: 100000,
        balanceCap: 100000,
        createdAt: '2026-05-10T14:30:00Z'
      },
      {
        id: 'acc-2',
        name: 'Amine Meziane',
        email: 'amine.meziane@outlook.com',
        phoneNumber: '0661987654',
        kycLevel: 2,
        kycStatus: 'ACTIVE' as const,
        balance: 230000,
        iban: generateAlgerianIBAN(2),
        dailyDebitSum: 0,
        dailyDebitLimit: 500000,
        balanceCap: 500000,
        createdAt: '2026-05-10T14:30:00Z'
      }
    ];

    (db as any).data = {
      accounts: testAccounts,
      transactions: [],
      agents: [],
      cantonmentRecords: [],
      guarantee: {
        id: 'g-1',
        amount: 50000000,
        issueDate: '2025-06-01',
        expiryDate: '2027-09-15',
        status: 'ACTIVE'
      },
      auditLogs: [],
      totpSecrets: {},
      commissionSettlements: [],
      guaranteeRenewals: [],
      deviceFingerprints: [],
      blockedEntities: [],
      trustedBeneficiaries: [],
      heldTransactions: [],
      swiftMessages: [],
      multiSigTransactions: [],
      failedTransactionRetries: [],
      complianceReports: [],
      complianceDecisions: []
    };
  });

  it('should return initial account list', () => {
    const accounts = db.getAccounts();
    expect(accounts).toHaveLength(2);
    expect(accounts[0].id).toBe('acc-1');
    expect(accounts[0].name).toBe('Sofiane Brahimi');
  });

  it('should get account by ID', () => {
    const account = db.getAccountById('acc-1');
    expect(account).toBeDefined();
    expect(account?.name).toBe('Sofiane Brahimi');

    const nonExistent = db.getAccountById('non-existent');
    expect(nonExistent).toBeUndefined();
  });

  it('should submit kyc upgrade', () => {
    const account = db.submitKycUpgrade('acc-1', 2, {
      idCardNumber: '123456789',
      idCardUrl: 'http://docs.com/id.jpg'
    });
    expect(account.kycStatus).toBe('PENDING');
    expect(account.kycLevel).toBe(2);
    expect(account.idCardNumber).toBe('123456789');

    // Retrieve again to check state persistence
    const retrieved = db.getAccountById('acc-1');
    expect(retrieved?.kycStatus).toBe('PENDING');
  });

  it('should handle audit logging', () => {
    db.logAudit('USER_LOGIN', 'User sofiane.b logged in from IP', 'INFO', '192.168.1.1');
    const logs = db.getAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('USER_LOGIN');
    expect(logs[0].severity).toBe('INFO');
  });

  it('should register a new agent', () => {
    const agent = db.registerAgent(
      'Baidou Agent',
      'Oran',
      150000,
      { contractExpiryDate: '2028-12-31' }
    );
    expect(agent).toBeDefined();
    expect(agent.name).toBe('Baidou Agent');
    expect(agent.cashRegisters?.['df-psp']).toBe(150000);

    const agents = db.getAgents();
    expect(agents).toContainEqual(agent);
  });

  it('should block and unblock entity from fraud blacklist', () => {
    const blocked = db.addBlockedEntity(
      'IP',
      '192.168.5.5',
      'Malicious spam attempt',
      'H. Brahimi'
    );

    expect(db.isEntityBlocked('192.168.5.5', 'IP')).toBe(true);
    expect(db.isEntityBlocked('192.168.1.1', 'IP')).toBe(false);

    db.updateBlockedEntityStatus(blocked.id, 'LIFTED', 'Legitimate customer');
    expect(db.isEntityBlocked('192.168.5.5', 'IP')).toBe(false);
  });

  it('should fail transaction execution for invalid amounts', () => {
    expect(() => {
      db.executeTransaction({
        type: 'TRANSFER',
        amount: -50,
        senderIban: generateAlgerianIBAN(1),
        receiverIban: generateAlgerianIBAN(2),
        reference: 'invalid',
        ipAddress: '127.0.0.1',
        deviceId: 'dev-1'
      });
    }).toThrow('INVALID_AMOUNT');
  });

  it('should execute a successful Transfer between active accounts', () => {
    const sender = db.getAccountById('acc-2')!; // balance: 230000
    const receiver = db.getAccountById('acc-1')!; // balance: 45000

    const tx = db.executeTransaction({
      type: 'TRANSFER',
      amount: 10000,
      senderIban: sender.iban,
      receiverIban: receiver.iban,
      reference: 'Monthly Rent Payment',
      ipAddress: '127.0.0.1',
      deviceId: 'dev-1'
    });

    expect(tx).toBeDefined();
    expect(tx.amount).toBe(10000);
    expect(tx.senderIban).toBe(sender.iban);

    // Verify current balances in DB (fee for transfer is 0.5% capped, 10000 * 0.005 = 50 DA fee)
    expect(db.getAccountById('acc-2')?.balance).toBe(219950); // 230000 - 10000 - 50 = 219950
    expect(db.getAccountById('acc-1')?.balance).toBe(55000);
  });

  it('should fail transaction due to insufficient balance', () => {
    const sender = db.getAccountById('acc-1')!; // balance: 45000
    const receiver = db.getAccountById('acc-2')!; // balance: 230000

    expect(() => {
      db.executeTransaction({
        type: 'TRANSFER',
        amount: 46000, // less than 50000 unverified limit, but more than 45000 balance
        senderIban: sender.iban,
        receiverIban: receiver.iban,
        reference: 'Overdraft attempt',
        ipAddress: '127.0.0.1',
        deviceId: 'dev-1'
      });
    }).toThrow('INSUFFICIENT_FUNDS');
  });

  it('should fail transaction due to balance cap limit of receiver kyc level', () => {
    const sender = db.getAccountById('acc-2')!; // balance: 230000
    const receiver = db.getAccountById('acc-1')!; // balance: 45000, balanceCap: 100000

    // Add receiver as a trusted beneficiary of sender to bypass unverified limit (50k DA)
    db.addTrustedBeneficiary(sender.id, receiver.iban, receiver.name);

    expect(() => {
      db.executeTransaction({
        type: 'TRANSFER',
        amount: 80000, // 45000 + 80000 = 125000, which exceeds 100000 cap of Level 1 receiver
        senderIban: sender.iban,
        receiverIban: receiver.iban,
        reference: 'Large payment to trusted receiver',
        ipAddress: '127.0.0.1',
        deviceId: 'dev-1'
      });
    }).toThrow('BALANCE_CAP_EXCEEDED');
  });
});
