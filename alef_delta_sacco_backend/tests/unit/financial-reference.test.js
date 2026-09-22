import { jest } from '@jest/globals';
import {
  claimFinancialReference,
  getFinancialReferenceAvailability,
  normalizeFinancialReference
} from '../../src/modules/financial-references/financial-reference.service.js';

function createReferenceConnection() {
  const records = new Map();
  return {
    records,
    execute: jest.fn(async (_sql, params) => {
      const [referenceKey, referenceValue, referenceKind, sourceId, memberId, status, postedAt] = params;
      if (records.has(referenceKey)) {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        throw error;
      }
      records.set(referenceKey, {
        reference_key: referenceKey,
        reference_value: referenceValue,
        reference_kind: referenceKind,
        source_id: sourceId,
        member_id: memberId,
        status,
        posted_at: postedAt,
        created_at: '2026-09-16 00:00:00'
      });
      return [{ affectedRows: 1 }, null];
    }),
    query: jest.fn(async (_sql, [referenceKey]) => [[records.get(referenceKey)].filter(Boolean), null])
  };
}

describe('financial reference registry', () => {
  test('normalizes case and repeated whitespace', () => {
    expect(normalizeFinancialReference('  rcpt-2026   001  ')).toBe('RCPT-2026 001');
  });

  test('rejects a case-insensitive duplicate used by another operation', async () => {
    const connection = createReferenceConnection();
    await claimFinancialReference({
      reference: 'BANK-REC-001',
      referenceKind: 'ACCOUNT_TRANSACTION',
      sourceId: 'transaction-1',
      status: 'POSTED',
      connection
    });

    await expect(claimFinancialReference({
      reference: ' bank-rec-001 ',
      referenceKind: 'LOAN_REPAYMENT_BANK',
      sourceId: 'repayment-1',
      status: 'POSTED',
      connection
    })).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE_FINANCIAL_REFERENCE'
    });
  });

  test('allows the same owner to retry its reservation idempotently', async () => {
    const connection = createReferenceConnection();
    const input = {
      reference: 'MEMBER-DEP-001',
      referenceKind: 'DEPOSIT_REQUEST',
      sourceId: 'request-1',
      status: 'RESERVED',
      connection
    };
    await claimFinancialReference(input);
    await expect(claimFinancialReference(input)).resolves.toMatchObject({
      reference_kind: 'DEPOSIT_REQUEST',
      source_id: 'request-1'
    });
  });

  test('requires a non-empty reference before querying availability', async () => {
    await expect(getFinancialReferenceAvailability('   ')).rejects.toMatchObject({ status: 400 });
  });
});
