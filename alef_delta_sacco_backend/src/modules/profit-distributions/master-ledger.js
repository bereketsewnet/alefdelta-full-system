import { v4 as uuid } from 'uuid';
import { query, withTransaction } from '../../core/db.js';
import httpError from '../../core/utils/httpError.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import { addisAbabaDate, centsToEtb, etbToCents } from './money.js';

export const MASTER_ACCOUNT_KEY = 'ETB_MASTER';

function mapLedger(row) {
  return {
    ...row,
    amount: Number(row.amount).toFixed(2),
    balance_after: Number(row.balance_after).toFixed(2),
    affects_profit: Boolean(row.affects_profit),
    affects_balance: row.affects_balance === undefined ? true : Boolean(row.affects_balance)
  };
}

export async function postMasterEntry(connection, payload) {
  if (!connection) throw new Error('Master ledger posting requires a database transaction');
  if (payload.idempotencyKey) {
    const [existingRows] = await connection.query('SELECT * FROM sacco_master_ledger WHERE idempotency_key = ?', [payload.idempotencyKey]);
    if (existingRows[0]) return { entry: mapLedger(existingRows[0]), duplicate: true };
  }
  if (payload.sourceType && payload.sourceId && payload.sourceComponent) {
    const [existingRows] = await connection.query(
      'SELECT * FROM sacco_master_ledger WHERE source_type = ? AND source_id = ? AND source_component = ?',
      [payload.sourceType, payload.sourceId, payload.sourceComponent]
    );
    if (existingRows[0]) return { entry: mapLedger(existingRows[0]), duplicate: true };
  }

  const amountCents = etbToCents(payload.amount);
  if (amountCents <= 0n) throw httpError(400, 'Master ledger amount must be greater than zero');
  const [accountRows] = await connection.query('SELECT * FROM sacco_master_account WHERE account_key = ? FOR UPDATE', [MASTER_ACCOUNT_KEY]);
  const account = accountRows[0];
  if (!account) throw httpError(500, 'SACCO master account is not configured');
  const currentCents = etbToCents(account.balance);
  const affectsBalance = payload.affectsBalance !== false;
  const nextCents = !affectsBalance ? currentCents : payload.direction === 'INFLOW' ? currentCents + amountCents : currentCents - amountCents;
  if (nextCents < 0n) throw httpError(409, 'Insufficient SACCO master account balance');

  const ledgerId = uuid();
  const nextBalance = centsToEtb(nextCents);
  await connection.execute(
    `INSERT INTO sacco_master_ledger
      (ledger_id, account_key, entry_date, direction, entry_type, amount, balance_after, affects_profit, affects_balance,
       source_type, source_id, source_component, distribution_id, performed_by, description,
       idempotency_key, reversal_of)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ledgerId, MASTER_ACCOUNT_KEY, payload.entryDate, payload.direction, payload.entryType,
      centsToEtb(amountCents), nextBalance, payload.affectsProfit === false ? 0 : 1, affectsBalance ? 1 : 0,
      payload.sourceType || null, payload.sourceId || null, payload.sourceComponent || null,
      payload.distributionId || null, payload.performedBy || null, payload.description || null,
      payload.idempotencyKey || null, payload.reversalOf || null]
  );
  if (affectsBalance) await connection.execute(
    'UPDATE sacco_master_account SET balance = ?, version = version + 1 WHERE account_key = ?',
    [nextBalance, MASTER_ACCOUNT_KEY]
  );
  return { entry: mapLedger({ ledger_id: ledgerId, ...payload, amount: centsToEtb(amountCents), balance_after: nextBalance, affects_profit: payload.affectsProfit !== false, affects_balance: affectsBalance }), duplicate: false };
}

export async function getMasterSummary() {
  const [account] = await query('SELECT * FROM sacco_master_account WHERE account_key = ?', [MASTER_ACCOUNT_KEY]);
  const [totals] = await query(`SELECT
    COALESCE(SUM(CASE WHEN affects_balance = 1 AND direction = 'INFLOW' THEN amount ELSE 0 END),0) total_inflows,
    COALESCE(SUM(CASE WHEN affects_balance = 1 AND direction = 'OUTFLOW' THEN amount ELSE 0 END),0) total_outflows,
    COALESCE(SUM(CASE WHEN affects_profit = 1 AND direction = 'INFLOW' THEN amount ELSE 0 END),0) operating_inflows,
    COALESCE(SUM(CASE WHEN affects_profit = 1 AND direction = 'OUTFLOW' THEN amount ELSE 0 END),0) operating_outflows
    FROM sacco_master_ledger`);
  const [retained] = await query(`SELECT COALESCE(SUM(reserve_amount + retained_allocation_amount),0) amount
    FROM profit_distributions WHERE status = 'PAID'`);
  const balance = Number(account?.balance || 0);
  return {
    account_key: MASTER_ACCOUNT_KEY,
    currency: 'ETB',
    balance: balance.toFixed(2),
    total_inflows: Number(totals.total_inflows).toFixed(2),
    total_outflows: Number(totals.total_outflows).toFixed(2),
    operating_profit: (Number(totals.operating_inflows) - Number(totals.operating_outflows)).toFixed(2),
    retained_allocations: Number(retained.amount).toFixed(2),
    available_balance: balance.toFixed(2),
    version: Number(account?.version || 0)
  };
}

export async function listMasterLedger(filters = {}) {
  const where = [];
  const params = [];
  if (filters.date_from) { where.push('l.entry_date >= ?'); params.push(filters.date_from); }
  if (filters.date_to) { where.push('l.entry_date <= ?'); params.push(filters.date_to); }
  if (filters.direction) { where.push('l.direction = ?'); params.push(filters.direction); }
  if (filters.entry_type) { where.push('l.entry_type = ?'); params.push(filters.entry_type); }
  const limit = Math.min(200, Math.max(1, Number(filters.limit || 50)));
  const offset = Math.max(0, Number(filters.offset || 0));
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(`SELECT l.*, u.username performed_by_username
    FROM sacco_master_ledger l LEFT JOIN users u ON u.user_id = l.performed_by
    ${clause} ORDER BY l.entry_date DESC, l.posted_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [count] = await query(`SELECT COUNT(*) total FROM sacco_master_ledger l ${clause}`, params);
  return { data: rows.map(mapLedger), total: Number(count.total), limit, offset };
}

export async function createManualAdjustment(payload, actor) {
  const direction = payload.direction;
  if (!['INFLOW', 'OUTFLOW'].includes(direction)) throw httpError(400, 'direction must be INFLOW or OUTFLOW');
  const description = String(payload.description || '').trim();
  if (description.length < 10) throw httpError(400, 'A description of at least 10 characters is required');
  if (!payload.idempotency_key) throw httpError(400, 'idempotency_key is required');
  const entryDate = payload.entry_date || addisAbabaDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) throw httpError(400, 'entry_date must use YYYY-MM-DD format');
  const defaultType = direction === 'INFLOW' ? 'MANUAL_REVENUE' : 'MANUAL_EXPENSE';
  const entryType = payload.classification || defaultType;
  if (!['MANUAL_REVENUE', 'MANUAL_EXPENSE', 'OPENING_ADJUSTMENT'].includes(entryType)) throw httpError(400, 'classification must be MANUAL_REVENUE, MANUAL_EXPENSE or OPENING_ADJUSTMENT');
  if (entryType === 'MANUAL_REVENUE' && direction !== 'INFLOW') throw httpError(400, 'MANUAL_REVENUE must be an INFLOW');
  if (entryType === 'MANUAL_EXPENSE' && direction !== 'OUTFLOW') throw httpError(400, 'MANUAL_EXPENSE must be an OUTFLOW');
  return withTransaction(async (connection) => {
    const result = await postMasterEntry(connection, {
      entryDate,
      direction,
      entryType,
      amount: payload.amount,
      affectsProfit: payload.affects_profit !== false,
      sourceType: 'MANUAL_ADJUSTMENT',
      sourceId: payload.idempotency_key,
      sourceComponent: direction,
      performedBy: actor.userId,
      description,
      idempotencyKey: payload.idempotency_key
    });
    if (!result.duplicate) await insertAuditLog({ userId: actor.userId, action: 'MASTER_LEDGER_MANUAL_ADJUSTMENT', entity: 'sacco_master_ledger', entityId: result.entry.ledger_id, metadata: { direction, classification: entryType, amount: payload.amount, affects_profit: payload.affects_profit !== false, description }, connection });
    return result.entry;
  });
}
