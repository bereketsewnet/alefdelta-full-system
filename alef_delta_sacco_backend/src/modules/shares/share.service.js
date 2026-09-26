import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { query, withTransaction } from '../../core/db.js';
import { insertTransaction } from '../transactions/transaction.repository.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import {
  assertFinancialReferenceOwner,
  claimFinancialReference,
  cleanFinancialReference,
  markFinancialReferencePosted,
  markFinancialReferenceRetired
} from '../financial-references/financial-reference.service.js';
import {
  SHARE_UNIT_SCALE,
  calculatePurchaseUnits,
  centsToEtb,
  divideHalfUp,
  etbToCents,
  microsToUnits,
  unitsToMicros
} from './share-money.js';

function normalizePositiveMoney(value, label = 'Amount') {
  let cents;
  try {
    cents = etbToCents(value);
  } catch (_error) {
    throw httpError(400, `${label} must be a valid ETB amount with at most two decimal places`);
  }
  if (cents <= 0n) throw httpError(400, `${label} must be greater than zero`);
  return cents;
}

function normalizeRemark(value) {
  const remark = String(value || '').trim();
  if (remark.length > 2000) throw httpError(400, 'Reason / Remark must not exceed 2,000 characters');
  return remark || null;
}

async function getShareConfig(connection = null) {
  const sql = `SELECT config_key, config_value FROM system_config
    WHERE config_key IN ('share_price','min_shares_required')`;
  const rows = connection ? (await connection.query(sql))[0] : await query(sql);
  const values = Object.fromEntries(rows.map((row) => [row.config_key, row.config_value]));
  let priceCents;
  let minimumMicros;
  try {
    priceCents = etbToCents(values.share_price || '300');
    minimumMicros = unitsToMicros(values.min_shares_required || '10');
  } catch (_error) {
    throw httpError(409, 'Share settings are invalid. Configure a valid price and minimum share target.');
  }
  if (priceCents <= 0n) throw httpError(409, 'Configured share price must be greater than zero');
  return { priceCents, minimumMicros };
}

async function findShareAccountByMember(memberId, connection = null, lock = false) {
  const sql = `SELECT a.*, ap.financial_category, ap.name product_name, m.status member_status,
      m.membership_no, m.first_name, m.middle_name, m.last_name
    FROM accounts a
    JOIN account_products ap ON ap.product_code = a.product_code
    JOIN members m ON m.member_id = a.member_id
    WHERE a.member_id = ? AND ap.financial_category = 'SHARE_CAPITAL' AND a.status <> 'CLOSED'
    ORDER BY a.created_at${lock ? ' FOR UPDATE' : ''}`;
  const rows = connection ? (await connection.query(sql, [memberId]))[0] : await query(sql, [memberId]);
  if (rows.length > 1) throw httpError(409, 'Member has multiple active Share Capital accounts. Resolve the duplicate before posting.');
  return rows[0] || null;
}

async function findShareAccountById(accountId, connection, lock = false) {
  const [rows] = await connection.query(`SELECT a.*, ap.financial_category, m.status member_status
    FROM accounts a
    JOIN account_products ap ON ap.product_code = a.product_code
    JOIN members m ON m.member_id = a.member_id
    WHERE a.account_id = ?${lock ? ' FOR UPDATE' : ''}`, [accountId]);
  const account = rows[0];
  if (!account) throw httpError(404, 'Share Capital account not found');
  if (account.financial_category !== 'SHARE_CAPITAL') throw httpError(400, 'Selected account is not a Share Capital account');
  return account;
}

export function assertPurchaseAllowed(account) {
  if (account.status !== 'ACTIVE') throw httpError(403, `Cannot purchase shares into a ${String(account.status).toLowerCase()} account`);
  if (account.member_status !== 'ACTIVE') throw httpError(403, 'Only an ACTIVE member may purchase shares');
}

export function assertRedemptionAllowed(account) {
  if (account.status === 'FROZEN') throw httpError(403, 'Cannot redeem shares from a frozen account');
  if (account.status === 'CLOSED') throw httpError(403, 'Cannot redeem shares from a closed account');
  if (account.member_status !== 'ACTIVE') throw httpError(403, 'Only an ACTIVE member may redeem shares');
}

async function loadFifoLots(accountId, connection) {
  // Lock the immutable lots themselves first. Locking an aggregate LEFT JOIN is
  // database-version dependent and may not lock every source row consistently.
  const [lots] = await connection.query(`SELECT * FROM share_purchase_lots
    WHERE account_id = ? ORDER BY acquired_at, lot_id FOR UPDATE`, [accountId]);
  if (!lots.length) return [];
  const [redeemed] = await connection.query(`SELECT ra.lot_id,
      COALESCE(SUM(ra.amount_redeemed),0) redeemed_amount,
      COALESCE(SUM(ra.units_redeemed),0) redeemed_units
    FROM share_redemption_allocations ra
    JOIN share_purchase_lots l ON l.lot_id = ra.lot_id
    WHERE l.account_id = ? GROUP BY ra.lot_id`, [accountId]);
  const redeemedByLot = new Map(redeemed.map((row) => [row.lot_id, row]));
  return lots.map((lot) => ({
    ...lot,
    remainingAmountCents: etbToCents(lot.original_amount) - etbToCents(redeemedByLot.get(lot.lot_id)?.redeemed_amount || '0'),
    remainingUnitMicros: unitsToMicros(lot.original_units) - unitsToMicros(redeemedByLot.get(lot.lot_id)?.redeemed_units || '0')
  })).filter((lot) => lot.remainingAmountCents > 0n && lot.remainingUnitMicros > 0n);
}

export async function assertShareLedgerConsistency(account, connection) {
  const [rows] = await connection.query(`SELECT COUNT(*) entry_count,
      COALESCE(SUM(CASE WHEN entry_type = 'PURCHASE' THEN amount ELSE -amount END),0) ledger_balance,
      COALESCE(SUM(unit_delta),0) ledger_units
    FROM share_unit_entries WHERE account_id = ?`, [account.account_id]);
  const ledger = rows[0];
  const accountBalance = etbToCents(account.balance || '0');
  const accountUnits = unitsToMicros(account.share_unit_balance || '0');
  const ledgerBalance = etbToCents(ledger.ledger_balance || '0');
  const ledgerUnits = unitsToMicros(ledger.ledger_units || '0');
  if (accountBalance !== ledgerBalance || accountUnits !== ledgerUnits) {
    throw httpError(409, 'Share Capital account does not reconcile with its append-only share ledger. No transaction was posted; an administrator must reconcile the legacy balance.');
  }
}

function requireIdempotencyKey(value) {
  const key = String(value || '').trim();
  if (!key) throw httpError(400, 'Idempotency-Key header is required');
  if (key.length > 100) throw httpError(400, 'Idempotency-Key must not exceed 100 characters');
  return key;
}

async function findExistingPosting(connection, idempotencyKey, expectedType, accountId, amountCents, expectedReference, expectedBankReceiptNo) {
  const [rows] = await connection.query(`SELECT se.share_entry_id, se.transaction_id, se.account_id, se.entry_type,
      se.amount, se.share_price, se.unit_delta, se.units_after, se.balance_after, t.reference, t.bank_receipt_no
    FROM share_unit_entries se JOIN transactions t ON t.txn_id = se.transaction_id
    WHERE se.idempotency_key = ?`, [idempotencyKey]);
  const existing = rows[0];
  if (!existing) return null;
  const expectedCompany = cleanFinancialReference(expectedReference);
  const expectedBank = cleanFinancialReference(expectedBankReceiptNo) || null;
  if (existing.entry_type !== expectedType || existing.account_id !== accountId || etbToCents(existing.amount) !== amountCents ||
      existing.reference !== expectedCompany || (existing.bank_receipt_no || null) !== expectedBank) {
    throw httpError(409, 'Idempotency key was already used for a different share transaction');
  }
  const base = {
    transaction_id: existing.transaction_id,
    share_entry_id: existing.share_entry_id,
    amount: String(existing.amount),
    units_after: String(existing.units_after),
    balance_after: String(existing.balance_after),
    idempotent_replay: true
  };
  return expectedType === 'PURCHASE'
    ? { ...base, share_price: String(existing.share_price), units_purchased: String(existing.unit_delta) }
    : { ...base, units_redeemed: String(existing.unit_delta).replace(/^-/, '') };
}

export function allocateRedemption(lots, requestedCents) {
  let remainingCents = BigInt(requestedCents);
  const allocations = [];
  for (const lot of lots) {
    if (remainingCents <= 0n) break;
    const amountCents = remainingCents < lot.remainingAmountCents ? remainingCents : lot.remainingAmountCents;
    const unitsMicros = amountCents === lot.remainingAmountCents
      ? lot.remainingUnitMicros
      : divideHalfUp(amountCents * SHARE_UNIT_SCALE, etbToCents(lot.purchase_price));
    if (unitsMicros <= 0n || unitsMicros > lot.remainingUnitMicros) {
      throw httpError(409, 'Share lot precision is inconsistent. Redemption was not posted.');
    }
    allocations.push({ lot, amountCents, unitsMicros });
    remainingCents -= amountCents;
  }
  if (remainingCents > 0n) throw httpError(400, `Insufficient contributed share capital. Available: ETB ${centsToEtb(requestedCents - remainingCents)}`);
  return allocations;
}

function summaryFromAccount(account, config) {
  const balanceCents = etbToCents(account?.balance || '0');
  const lienCents = etbToCents(account?.lien_amount || '0');
  const unitMicros = unitsToMicros(account?.share_unit_balance || '0');
  const deficitMicros = config.minimumMicros > unitMicros ? config.minimumMicros - unitMicros : 0n;
  const estimatedDeficitCents = divideHalfUp(deficitMicros * config.priceCents, SHARE_UNIT_SCALE);
  return {
    account_id: account?.account_id || null,
    product_code: account?.product_code || 'SHR_CAP',
    status: account?.status || null,
    balance: centsToEtb(balanceCents),
    share_units: microsToUnits(unitMicros),
    active_share_price: centsToEtb(config.priceCents),
    minimum_share_target: microsToUnits(config.minimumMicros),
    unit_deficit: microsToUnits(deficitMicros),
    estimated_target_deficit: centsToEtb(estimatedDeficitCents),
    actual_lien: centsToEtb(lienCents),
    available_balance: centsToEtb(balanceCents > lienCents ? balanceCents - lienCents : 0n)
  };
}

export async function getMemberShareSummary(memberId) {
  const [account, config] = await Promise.all([findShareAccountByMember(memberId), getShareConfig()]);
  return summaryFromAccount(account, config);
}

export async function getMemberShareEntries(memberId, { limit = 50, offset = 0 } = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  return query(`SELECT se.share_entry_id, se.entry_type, se.amount, se.share_price, se.unit_delta,
      se.units_after, se.balance_after, se.effective_at, se.transaction_id, se.member_request_id,
      t.reference, t.receipt_photo_url, t.bank_receipt_no, t.bank_receipt_photo_url, t.remark,
      u.username performed_by_username
    FROM share_unit_entries se
    JOIN transactions t ON t.txn_id = se.transaction_id
    LEFT JOIN users u ON u.user_id = se.performed_by
    WHERE se.member_id = ?
    ORDER BY se.effective_at DESC, se.created_at DESC
    LIMIT ? OFFSET ?`, [memberId, safeLimit, safeOffset]);
}

export async function quoteShareTransaction({ memberId, accountId, action, amount }) {
  const amountCents = normalizePositiveMoney(amount);
  return withTransaction(async (connection) => {
    const account = accountId
      ? await findShareAccountById(accountId, connection, true)
      : await findShareAccountByMember(memberId, connection, true);
    if (!account) throw httpError(404, 'Member does not have a Share Capital account');
    await assertShareLedgerConsistency(account, connection);
    const config = await getShareConfig(connection);
    const currentMicros = unitsToMicros(account.share_unit_balance || '0');
    if (action === 'PURCHASE') {
      assertPurchaseAllowed(account);
      const unitsMicros = calculatePurchaseUnits(amountCents, config.priceCents);
      if (unitsMicros <= 0n) throw httpError(400, 'Amount is too small to purchase 0.00000001 share at the active price');
      return {
        action,
        amount: centsToEtb(amountCents),
        share_price: centsToEtb(config.priceCents),
        unit_change: microsToUnits(unitsMicros),
        units_after: microsToUnits(currentMicros + unitsMicros),
        balance_after: centsToEtb(etbToCents(account.balance) + amountCents),
        minimum_share_target: microsToUnits(config.minimumMicros)
      };
    }
    if (action !== 'REDEMPTION') throw httpError(400, 'action must be PURCHASE or REDEMPTION');
    assertRedemptionAllowed(account);
    const rawAvailableCents = etbToCents(account.balance) - etbToCents(account.lien_amount || '0');
    const availableCents = rawAvailableCents > 0n ? rawAvailableCents : 0n;
    if (amountCents > availableCents) throw httpError(400, `Insufficient available balance. Available: ETB ${centsToEtb(availableCents)}`);
    const allocations = allocateRedemption(await loadFifoLots(account.account_id, connection), amountCents);
    const unitsMicros = allocations.reduce((sum, row) => sum + row.unitsMicros, 0n);
    if (unitsMicros > currentMicros) throw httpError(409, 'Share unit balance is inconsistent with purchase lots');
    return {
      action,
      amount: centsToEtb(amountCents),
      unit_change: microsToUnits(unitsMicros),
      units_after: microsToUnits(currentMicros - unitsMicros),
      balance_after: centsToEtb(etbToCents(account.balance) - amountCents),
      fifo_lots: allocations.map(({ lot, amountCents: lotAmount, unitsMicros: lotUnits }) => ({
        lot_id: lot.lot_id,
        acquired_at: lot.acquired_at,
        purchase_price: String(lot.purchase_price),
        amount: centsToEtb(lotAmount),
        units: microsToUnits(lotUnits)
      }))
    };
  });
}

async function claimPostingReferences(connection, { txnId, memberId, reference, bankReceiptNo, bankReferenceOwner }) {
  const cleanReference = cleanFinancialReference(reference);
  if (!cleanReference) throw httpError(400, 'SACCO / Company Receipt No. is required');
  if (cleanReference.length > 120) throw httpError(400, 'SACCO / Company Receipt No. must not exceed 120 characters');
  await claimFinancialReference({ reference: cleanReference, referenceKind: 'ACCOUNT_TRANSACTION', sourceId: txnId, memberId, status: 'POSTED', connection });
  const cleanBank = cleanFinancialReference(bankReceiptNo);
  if (cleanBank.length > 160) throw httpError(400, 'Bank Receipt No. must not exceed 160 characters');
  if (cleanBank) {
    if (bankReferenceOwner) {
      await assertFinancialReferenceOwner({ reference: cleanBank, referenceKind: bankReferenceOwner.referenceKind, sourceId: bankReferenceOwner.sourceId, connection });
      await markFinancialReferencePosted(cleanBank, bankReferenceOwner.referenceKind, bankReferenceOwner.sourceId, connection);
    } else {
      await claimFinancialReference({ reference: cleanBank, referenceKind: 'ACCOUNT_TRANSACTION_BANK', sourceId: txnId, memberId, status: 'POSTED', connection });
    }
  }
  return { cleanReference, cleanBank: cleanBank || null };
}

export async function purchaseShares(payload, existingConnection = null) {
  const amountCents = normalizePositiveMoney(payload.amount);
  const idempotencyKey = requireIdempotencyKey(payload.idempotencyKey);
  const remark = normalizeRemark(payload.remark);
  const executePurchase = async (connection) => {
    const account = await findShareAccountById(payload.accountId, connection, true);
    // Recheck only after acquiring the account lock. A concurrent retry may
    // commit while this request is waiting for that lock.
    const existing = await findExistingPosting(connection, idempotencyKey, 'PURCHASE', payload.accountId, amountCents, payload.reference, payload.bankReceiptNo);
    if (existing) return existing;
    await assertShareLedgerConsistency(account, connection);
    assertPurchaseAllowed(account);
    const config = await getShareConfig(connection);
    const priceCents = payload.fixedPrice ? normalizePositiveMoney(payload.fixedPrice, 'Share price') : config.priceCents;
    const unitsMicros = calculatePurchaseUnits(amountCents, priceCents);
    if (unitsMicros <= 0n) throw httpError(400, 'Amount is too small to purchase 0.00000001 share at this price');
    const currentMicros = unitsToMicros(account.share_unit_balance || '0');
    const currentBalanceCents = etbToCents(account.balance);
    const unitsAfter = currentMicros + unitsMicros;
    const balanceAfter = currentBalanceCents + amountCents;
    const txnId = uuid();
    const entryId = uuid();
    const references = await claimPostingReferences(connection, { txnId, memberId: account.member_id, reference: payload.reference, bankReceiptNo: payload.bankReceiptNo, bankReferenceOwner: payload.bankReferenceOwner });
    await connection.execute(`UPDATE accounts SET balance = ?, share_unit_balance = ?, version = version + 1, updated_at = NOW()
      WHERE account_id = ?`, [centsToEtb(balanceAfter), microsToUnits(unitsAfter), account.account_id]);
    await insertTransaction({
      txn_id: txnId, account_id: account.account_id, txn_type: 'DEPOSIT', transaction_category: 'SHARE_PURCHASE',
      amount: centsToEtb(amountCents), balance_after: centsToEtb(balanceAfter), reference: references.cleanReference,
      receipt_photo_url: payload.receiptPhotoUrl || null, bank_receipt_no: references.cleanBank,
      bank_receipt_photo_url: payload.bankReceiptPhotoUrl || null, remark,
      performed_by: payload.performedBy || null, idempotency_key: idempotencyKey
    }, connection);
    await connection.execute(`INSERT INTO share_unit_entries
      (share_entry_id, member_id, account_id, transaction_id, member_request_id, entry_type, amount,
       share_price, unit_delta, units_after, balance_after, performed_by, idempotency_key, effective_at)
      VALUES (?, ?, ?, ?, ?, 'PURCHASE', ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [entryId, account.member_id, account.account_id, txnId, payload.memberRequestId || null, centsToEtb(amountCents),
      centsToEtb(priceCents), microsToUnits(unitsMicros), microsToUnits(unitsAfter), centsToEtb(balanceAfter),
      payload.performedBy || null, idempotencyKey]);
    await connection.execute(`INSERT INTO share_purchase_lots
      (lot_id, account_id, purchase_entry_id, original_amount, original_units, purchase_price, acquired_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [uuid(), account.account_id, entryId, centsToEtb(amountCents), microsToUnits(unitsMicros), centsToEtb(priceCents)]);
    await insertAuditLog({ userId: payload.performedBy || null, action: 'SHARE_PURCHASE', entity: 'accounts', entityId: account.account_id,
      metadata: { transaction_id: txnId, amount: centsToEtb(amountCents), units: microsToUnits(unitsMicros), share_price: centsToEtb(priceCents), member_request_id: payload.memberRequestId || null }, connection });
    return { transaction_id: txnId, share_entry_id: entryId, amount: centsToEtb(amountCents), share_price: centsToEtb(priceCents), units_purchased: microsToUnits(unitsMicros), units_after: microsToUnits(unitsAfter), balance_after: centsToEtb(balanceAfter) };
  };
  return existingConnection ? executePurchase(existingConnection) : withTransaction(executePurchase);
}

export async function redeemShares(payload) {
  const amountCents = normalizePositiveMoney(payload.amount);
  const idempotencyKey = requireIdempotencyKey(payload.idempotencyKey);
  const remark = normalizeRemark(payload.remark);
  return withTransaction(async (connection) => {
    const account = await findShareAccountById(payload.accountId, connection, true);
    const existing = await findExistingPosting(connection, idempotencyKey, 'REDEMPTION', payload.accountId, amountCents, payload.reference, payload.bankReceiptNo);
    if (existing) return existing;
    await assertShareLedgerConsistency(account, connection);
    assertRedemptionAllowed(account);
    const balanceCents = etbToCents(account.balance);
    const rawAvailableCents = balanceCents - etbToCents(account.lien_amount || '0');
    const availableCents = rawAvailableCents > 0n ? rawAvailableCents : 0n;
    if (amountCents > availableCents) throw httpError(400, `Insufficient available balance. Available: ETB ${centsToEtb(availableCents)}`);
    const allocations = allocateRedemption(await loadFifoLots(account.account_id, connection), amountCents);
    const redeemedMicros = allocations.reduce((sum, row) => sum + row.unitsMicros, 0n);
    const currentMicros = unitsToMicros(account.share_unit_balance || '0');
    if (redeemedMicros > currentMicros) throw httpError(409, 'Share unit balance is inconsistent with purchase lots');
    const unitsAfter = currentMicros - redeemedMicros;
    const balanceAfter = balanceCents - amountCents;
    const config = await getShareConfig(connection);
    const txnId = uuid();
    const entryId = uuid();
    const references = await claimPostingReferences(connection, { txnId, memberId: account.member_id, reference: payload.reference, bankReceiptNo: payload.bankReceiptNo });
    await connection.execute(`UPDATE accounts SET balance = ?, share_unit_balance = ?, version = version + 1, updated_at = NOW()
      WHERE account_id = ?`, [centsToEtb(balanceAfter), microsToUnits(unitsAfter), account.account_id]);
    await insertTransaction({
      txn_id: txnId, account_id: account.account_id, txn_type: 'WITHDRAWAL', transaction_category: 'SHARE_REDEMPTION',
      amount: centsToEtb(amountCents), balance_after: centsToEtb(balanceAfter), reference: references.cleanReference,
      receipt_photo_url: payload.receiptPhotoUrl || null, bank_receipt_no: references.cleanBank,
      bank_receipt_photo_url: payload.bankReceiptPhotoUrl || null, remark,
      performed_by: payload.performedBy || null, idempotency_key: idempotencyKey
    }, connection);
    await connection.execute(`INSERT INTO share_unit_entries
      (share_entry_id, member_id, account_id, transaction_id, entry_type, amount, share_price,
       unit_delta, units_after, balance_after, performed_by, idempotency_key, effective_at)
      VALUES (?, ?, ?, ?, 'REDEMPTION', ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [entryId, account.member_id, account.account_id, txnId, centsToEtb(amountCents), centsToEtb(config.priceCents),
      `-${microsToUnits(redeemedMicros)}`, microsToUnits(unitsAfter), centsToEtb(balanceAfter), payload.performedBy || null, idempotencyKey]);
    for (const allocation of allocations) {
      await connection.execute(`INSERT INTO share_redemption_allocations
        (allocation_id, redemption_entry_id, lot_id, amount_redeemed, units_redeemed)
        VALUES (?, ?, ?, ?, ?)`, [uuid(), entryId, allocation.lot.lot_id, centsToEtb(allocation.amountCents), microsToUnits(allocation.unitsMicros)]);
    }
    await insertAuditLog({ userId: payload.performedBy || null, action: 'SHARE_REDEMPTION', entity: 'accounts', entityId: account.account_id,
      metadata: { transaction_id: txnId, amount: centsToEtb(amountCents), units: microsToUnits(redeemedMicros), fifo_lots: allocations.map((row) => row.lot.lot_id) }, connection });
    return { transaction_id: txnId, share_entry_id: entryId, amount: centsToEtb(amountCents), units_redeemed: microsToUnits(redeemedMicros), units_after: microsToUnits(unitsAfter), balance_after: centsToEtb(balanceAfter) };
  });
}

export async function createSharePurchaseRequest(memberId, payload) {
  const amountCents = normalizePositiveMoney(payload.amount);
  const description = normalizeRemark(payload.description);
  const referenceNumber = cleanFinancialReference(payload.referenceNumber);
  if (!referenceNumber) throw httpError(400, 'Bank Receipt No. is required');
  if (referenceNumber.length > 100) throw httpError(400, 'Bank Receipt No. must not exceed 100 characters');
  if (!payload.receiptPhotoUrl) throw httpError(400, 'Bank receipt photo is required');
  return withTransaction(async (connection) => {
    const account = await findShareAccountByMember(memberId, connection, true);
    if (!account) throw httpError(404, 'Share Capital account not found. Please contact SACCO staff.');
    assertPurchaseAllowed(account);
    const config = await getShareConfig(connection);
    const quotedMicros = calculatePurchaseUnits(amountCents, config.priceCents);
    if (quotedMicros <= 0n) throw httpError(400, 'Amount is too small to purchase 0.00000001 share at the active price');
    const requestId = uuid();
    await claimFinancialReference({ reference: referenceNumber, referenceKind: 'DEPOSIT_REQUEST', sourceId: requestId, memberId, status: 'RESERVED', connection });
    await connection.execute(`INSERT INTO deposit_requests
      (request_id, member_id, account_id, request_type, amount, quoted_share_price, quoted_share_units,
       reference_number, receipt_photo_url, description, status)
      VALUES (?, ?, ?, 'SHARE_PURCHASE', ?, ?, ?, ?, ?, ?, 'PENDING')`,
    [requestId, memberId, account.account_id, centsToEtb(amountCents), centsToEtb(config.priceCents), microsToUnits(quotedMicros),
      referenceNumber, payload.receiptPhotoUrl, description]);
    await insertAuditLog({ userId: null, action: 'SHARE_PURCHASE_REQUEST_CREATED', entity: 'deposit_requests', entityId: requestId,
      metadata: { member_id: memberId, amount: centsToEtb(amountCents), share_price: centsToEtb(config.priceCents), units: microsToUnits(quotedMicros), reference_number: referenceNumber }, connection });
    return getSharePurchaseRequestById(requestId, connection);
  });
}

export async function getSharePurchaseRequestById(requestId, connection = null) {
  const sql = `SELECT dr.*, m.membership_no, m.first_name member_first_name, m.last_name member_last_name,
      a.product_code account_product_code, u.username approver_username, u.role approver_role
    FROM deposit_requests dr
    JOIN members m ON m.member_id = dr.member_id
    JOIN accounts a ON a.account_id = dr.account_id
    LEFT JOIN users u ON u.user_id = dr.approved_by
    WHERE dr.request_id = ? AND dr.request_type = 'SHARE_PURCHASE'`;
  const rows = connection ? (await connection.query(sql, [requestId]))[0] : await query(sql, [requestId]);
  return rows[0] || null;
}

export async function listSharePurchaseRequests(filters = {}) {
  const where = ["dr.request_type = 'SHARE_PURCHASE'"];
  const params = [];
  if (filters.memberId) { where.push('dr.member_id = ?'); params.push(filters.memberId); }
  if (filters.status && filters.status !== 'ALL') { where.push('dr.status = ?'); params.push(filters.status); }
  return query(`SELECT dr.*, m.membership_no, m.first_name member_first_name, m.last_name member_last_name,
      a.product_code account_product_code, u.username approver_username, u.role approver_role
    FROM deposit_requests dr
    JOIN members m ON m.member_id = dr.member_id
    JOIN accounts a ON a.account_id = dr.account_id
    LEFT JOIN users u ON u.user_id = dr.approved_by
    WHERE ${where.join(' AND ')}
    ORDER BY dr.created_at DESC`, params);
}

export async function approveSharePurchaseRequest(requestId, approverId) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(`SELECT * FROM deposit_requests
      WHERE request_id = ? AND request_type = 'SHARE_PURCHASE' FOR UPDATE`, [requestId]);
    const request = rows[0];
    if (!request) throw httpError(404, 'Share purchase request not found');
    if (request.status === 'APPROVED') return getSharePurchaseRequestById(requestId, connection);
    if (request.status !== 'PENDING') throw httpError(409, `Request is already ${request.status}`);
    const result = await purchaseShares({
      accountId: request.account_id,
      amount: request.amount,
      fixedPrice: request.quoted_share_price,
      reference: `MP-SHR-${request.request_id}`,
      bankReceiptNo: request.reference_number,
      bankReceiptPhotoUrl: request.receipt_photo_url,
      remark: request.description,
      performedBy: approverId,
      idempotencyKey: `share-request-${request.request_id}`,
      memberRequestId: request.request_id,
      bankReferenceOwner: { referenceKind: 'DEPOSIT_REQUEST', sourceId: request.request_id }
    }, connection);
    await connection.execute(`UPDATE deposit_requests SET status = 'APPROVED', approved_by = ?, approved_at = NOW(),
      posted_transaction_id = ? WHERE request_id = ?`, [approverId, result.transaction_id, requestId]);
    await insertAuditLog({ userId: approverId, action: 'SHARE_PURCHASE_REQUEST_APPROVED', entity: 'deposit_requests', entityId: requestId,
      metadata: { transaction_id: result.transaction_id, quoted_share_price: request.quoted_share_price, quoted_share_units: request.quoted_share_units }, connection });
    return getSharePurchaseRequestById(requestId, connection);
  });
}

export async function rejectSharePurchaseRequest(requestId, approverId, reason) {
  const cleanReason = String(reason || '').trim();
  if (cleanReason.length < 3) throw httpError(400, 'A rejection reason of at least 3 characters is required');
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(`SELECT * FROM deposit_requests
      WHERE request_id = ? AND request_type = 'SHARE_PURCHASE' FOR UPDATE`, [requestId]);
    const request = rows[0];
    if (!request) throw httpError(404, 'Share purchase request not found');
    if (request.status !== 'PENDING') throw httpError(409, `Request is already ${request.status}`);
    await connection.execute(`UPDATE deposit_requests SET status = 'REJECTED', approved_by = ?, approved_at = NOW(),
      rejection_reason = ? WHERE request_id = ?`, [approverId, cleanReason, requestId]);
    await markFinancialReferenceRetired(request.reference_number, 'DEPOSIT_REQUEST', requestId, connection);
    await insertAuditLog({ userId: approverId, action: 'SHARE_PURCHASE_REQUEST_REJECTED', entity: 'deposit_requests', entityId: requestId,
      metadata: { reason: cleanReason }, connection });
    return getSharePurchaseRequestById(requestId, connection);
  });
}

export { getShareConfig, findShareAccountByMember };
