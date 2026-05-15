import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import crypto from 'node:crypto';

const queryMock = jest.fn();
const executeMock = jest.fn();

jest.unstable_mockModule('../../src/core/db.js', () => ({
  query: queryMock,
  execute: executeMock
}));

const { idempotencyMiddleware } = await import('../../src/core/middleware/idempotency.js');

function computeHash(key, userId, endpoint, body) {
  return crypto.createHash('sha256').update(`${key}:${userId}:${endpoint}:${JSON.stringify(body)}`).digest('hex');
}

beforeEach(() => {
  queryMock.mockReset();
  executeMock.mockReset();
});

function createRes() {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.payload = payload;
    return res;
  };
  return res;
}

describe('idempotencyMiddleware', () => {
  it('serves cached responses when key already exists', async () => {
    const body = { amount: 100 };
    const hash = computeHash('abc', 'user-1', 'transactions:deposit', body);
    queryMock.mockResolvedValueOnce([
      { status_code: 201, response_json: JSON.stringify({ ok: true }), request_hash: hash }
    ]);
    const req = {
      header: () => 'abc',
      body,
      user: { userId: 'user-1' }
    };
    const res = createRes();
    let nextCalled = false;
    await idempotencyMiddleware('transactions:deposit')(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(201);
    expect(res.payload).toEqual({ ok: true });
  });

  it('stores placeholder for new idempotent calls', async () => {
    queryMock.mockResolvedValueOnce([]);
    const req = {
      header: () => 'new-key',
      body: { amount: 50 },
      user: { userId: 'user-9' }
    };
    const res = createRes();
    let downstreamCalled = false;
    await idempotencyMiddleware('transactions:deposit')(req, res, () => {
      downstreamCalled = true;
    });
    expect(downstreamCalled).toBe(true);
    await req.idempotency.save(201, { ok: true });
    expect(executeMock).toHaveBeenCalled();
  });
});
