import { v4 as uuid } from 'uuid';
import { query, withTransaction } from '../../core/db.js';
import httpError from '../../core/utils/httpError.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import { addisAbabaDate, allocateLargestRemainder, centsToEtb, etbToCents } from './money.js';
import { getMasterSummary, listMasterLedger, createManualAdjustment, postMasterEntry } from './master-ledger.js';
import { microsToUnits, unitsToMicros } from '../shares/share-money.js';

export { getMasterSummary, listMasterLedger, createManualAdjustment };

async function runQuery(connection, sql, params = []) {
  if (connection) {
    const [rows] = await connection.query(sql, params);
    return rows;
  }
  return query(sql, params);
}

function assertDate(value, field) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) throw httpError(400, `${field} must use YYYY-MM-DD format`);
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

async function loadPolicy(policyId = null, connection = null) {
  const rows = await runQuery(connection,
    `SELECT * FROM profit_distribution_policies
     WHERE ${policyId ? 'policy_id = ?' : "status = 'ACTIVE'"}
     ORDER BY policy_version DESC LIMIT 1`, policyId ? [policyId] : []);
  const policy = rows[0];
  if (!policy) throw httpError(409, 'No active profit-distribution policy is configured');
  const buckets = await runQuery(connection,
    `SELECT b.*, GROUP_CONCAT(ep.product_code ORDER BY ep.product_code) eligible_products
     FROM profit_distribution_buckets b
     LEFT JOIN profit_bucket_eligible_products ep ON ep.bucket_id = b.bucket_id
     WHERE b.policy_id = ? GROUP BY b.bucket_id ORDER BY b.display_order`, [policy.policy_id]);
  return {
    ...policy,
    reserve_bps: Number(policy.reserve_bps),
    board_quorum_count: Number(policy.board_quorum_count),
    buckets: buckets.map((bucket) => ({
      ...bucket,
      percentage_bps: Number(bucket.percentage_bps),
      is_member_payable: Boolean(bucket.is_member_payable),
      eligible_products: bucket.eligible_products ? bucket.eligible_products.split(',') : []
    }))
  };
}

export async function getCurrentPolicy() {
  return loadPolicy();
}

export async function listPolicies() {
  const policies = await query('SELECT * FROM profit_distribution_policies ORDER BY policy_version DESC');
  return Promise.all(policies.map((policy) => loadPolicy(policy.policy_id)));
}

function validatePolicyPayload(payload) {
  const reserveBps = Number(payload.reserve_bps);
  const quorum = Number(payload.board_quorum_count);
  const buckets = Array.isArray(payload.buckets) ? payload.buckets : [];
  if (!Number.isInteger(reserveBps) || reserveBps < 0 || reserveBps > 10000) throw httpError(400, 'reserve_bps must be an integer between 0 and 10000');
  if (!Number.isInteger(quorum) || quorum < 1) throw httpError(400, 'board_quorum_count must be at least 1');
  if (!payload.payout_product_code) throw httpError(400, 'payout_product_code is required');
  if (!buckets.length) throw httpError(400, 'At least one allocation bucket is required');
  const codes = new Set();
  let total = reserveBps;
  for (const bucket of buckets) {
    const code = String(bucket.bucket_code || '').trim().toUpperCase();
    const bps = Number(bucket.percentage_bps);
    if (!code || codes.has(code)) throw httpError(400, 'Bucket codes are required and must be unique');
    codes.add(code);
    if (!String(bucket.name || '').trim()) throw httpError(400, `Bucket ${code} requires a name`);
    if (!Number.isInteger(bps) || bps < 0 || bps > 10000) throw httpError(400, `Bucket ${code} has an invalid percentage`);
    if (!['SHARE_UNITS', 'SAVINGS_BALANCE', 'INTERNAL'].includes(bucket.allocation_basis)) throw httpError(400, `Bucket ${code} has an invalid allocation basis`);
    if (bucket.allocation_basis === 'SAVINGS_BALANCE' && (!Array.isArray(bucket.eligible_products) || !bucket.eligible_products.length)) throw httpError(400, `Savings bucket ${code} requires at least one eligible account product`);
    if (bucket.allocation_basis === 'INTERNAL' && bucket.is_member_payable) throw httpError(400, `Internal bucket ${code} cannot be member-payable`);
    total += bps;
  }
  if (total !== 10000) throw httpError(400, `Statutory reserve and allocation buckets must total exactly 100.00%; current total is ${(total / 100).toFixed(2)}%`);
  if (!buckets.some((item) => item.is_member_payable && item.allocation_basis === 'SHARE_UNITS')) throw httpError(400, 'A member-payable Share Units bucket is required');
  if (!buckets.some((item) => item.is_member_payable && item.allocation_basis === 'SAVINGS_BALANCE')) throw httpError(400, 'A member-payable Savings Balance bucket is required');
  return { reserveBps, quorum, buckets };
}

export async function createPolicy(payload, actor) {
  const valid = validatePolicyPayload(payload);
  return withTransaction(async (connection) => {
    const [productRows] = await connection.query(
      `SELECT product_code, financial_category, is_active FROM account_products
       WHERE product_code IN (${[payload.payout_product_code, ...valid.buckets.flatMap((b) => b.eligible_products || [])].map(() => '?').join(',')})`,
      [payload.payout_product_code, ...valid.buckets.flatMap((b) => b.eligible_products || [])]
    );
    const products = new Map(productRows.map((row) => [row.product_code, row]));
    const payoutProduct = products.get(payload.payout_product_code);
    if (!payoutProduct || !payoutProduct.is_active || payoutProduct.financial_category !== 'COMPULSORY_SAVINGS') throw httpError(400, 'Payout product must be an active compulsory-savings product');
    for (const bucket of valid.buckets.filter((b) => b.allocation_basis === 'SAVINGS_BALANCE')) {
      for (const code of bucket.eligible_products) {
        const product = products.get(code);
        if (!product || !product.is_active || !['COMPULSORY_SAVINGS', 'VOLUNTARY_SAVINGS'].includes(product.financial_category)) throw httpError(400, `Eligible savings product ${code} is invalid or inactive`);
      }
    }
    const [versionRows] = await connection.query('SELECT COALESCE(MAX(policy_version),0) version FROM profit_distribution_policies FOR UPDATE');
    const policyId = uuid();
    const version = Number(versionRows[0].version) + 1;
    await connection.execute("UPDATE profit_distribution_policies SET status = 'RETIRED', retired_at = NOW() WHERE status = 'ACTIVE'");
    await connection.execute(
      `INSERT INTO profit_distribution_policies
       (policy_id, policy_version, name, reserve_bps, board_quorum_count, payout_product_code, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
      [policyId, version, String(payload.name || `Profit Distribution Policy v${version}`).trim(), valid.reserveBps, valid.quorum, payload.payout_product_code, actor.userId]
    );
    for (let index = 0; index < valid.buckets.length; index += 1) {
      const bucket = valid.buckets[index];
      const bucketId = uuid();
      await connection.execute(
        `INSERT INTO profit_distribution_buckets
         (bucket_id, policy_id, bucket_code, name, percentage_bps, allocation_basis, is_member_payable, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [bucketId, policyId, String(bucket.bucket_code).trim().toUpperCase(), String(bucket.name).trim(), Number(bucket.percentage_bps), bucket.allocation_basis, bucket.is_member_payable ? 1 : 0, index + 1]
      );
      for (const code of bucket.eligible_products || []) await connection.execute('INSERT INTO profit_bucket_eligible_products (bucket_id, product_code) VALUES (?, ?)', [bucketId, code]);
    }
    await insertAuditLog({ userId: actor.userId, action: 'CREATE_PROFIT_DISTRIBUTION_POLICY', entity: 'profit_distribution_policies', entityId: policyId, newValue: payload, connection });
    return loadPolicy(policyId, connection);
  });
}

export async function activatePolicy(policyId, actor) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query('SELECT * FROM profit_distribution_policies WHERE policy_id = ? FOR UPDATE', [policyId]);
    const policy = rows[0];
    if (!policy) throw httpError(404, 'Profit-distribution policy version not found');
    if (policy.status === 'ACTIVE') return loadPolicy(policyId, connection);
    const candidate = await loadPolicy(policyId, connection);
    const productCodes = [candidate.payout_product_code, ...candidate.buckets.flatMap((bucket) => bucket.eligible_products || [])];
    const [products] = await connection.query(`SELECT product_code, is_active FROM account_products
      WHERE product_code IN (${productCodes.map(() => '?').join(',')})`, productCodes);
    const activeProducts = new Set(products.filter((product) => product.is_active).map((product) => product.product_code));
    const inactive = [...new Set(productCodes)].filter((code) => !activeProducts.has(code));
    if (inactive.length) throw httpError(409, `This policy cannot be activated because these account products are inactive or missing: ${inactive.join(', ')}`);
    await connection.execute("UPDATE profit_distribution_policies SET status = 'RETIRED', retired_at = NOW() WHERE status = 'ACTIVE'");
    await connection.execute("UPDATE profit_distribution_policies SET status = 'ACTIVE', retired_at = NULL WHERE policy_id = ?", [policyId]);
    await insertAuditLog({ userId: actor.userId, action: 'ACTIVATE_PROFIT_DISTRIBUTION_POLICY', entity: 'profit_distribution_policies', entityId: policyId, metadata: { policy_version: Number(policy.policy_version) }, connection });
    return loadPolicy(policyId, connection);
  });
}

function getPolicySnapshot(policy) {
  return {
    policy_id: policy.policy_id,
    policy_version: Number(policy.policy_version),
    name: policy.name,
    reserve_bps: policy.reserve_bps,
    board_quorum_count: policy.board_quorum_count,
    payout_product_code: policy.payout_product_code,
    buckets: policy.buckets.map((bucket) => ({
      bucket_code: bucket.bucket_code,
      name: bucket.name,
      percentage_bps: bucket.percentage_bps,
      allocation_basis: bucket.allocation_basis,
      is_member_payable: bucket.is_member_payable,
      eligible_products: bucket.eligible_products
    }))
  };
}

async function loadPeriodMemberBalances(connection, periodEnd, policy) {
  const accountRows = await runQuery(connection,
    `SELECT m.member_id, m.membership_no, m.first_name, m.middle_name, m.last_name,
            a.account_id, a.product_code, a.balance, ap.financial_category,
            COALESCE(SUM(CASE WHEN t.created_at >= DATE_ADD(?, INTERVAL 1 DAY)
              THEN CASE WHEN t.txn_type = 'DEPOSIT' THEN t.amount ELSE -t.amount END ELSE 0 END),0) future_net
     FROM members m
     LEFT JOIN accounts a ON a.member_id = m.member_id AND a.status = 'ACTIVE' AND a.created_at < DATE_ADD(?, INTERVAL 1 DAY)
     LEFT JOIN account_products ap ON ap.product_code = a.product_code
     LEFT JOIN transactions t ON t.account_id = a.account_id
     WHERE m.status IN ('ACTIVE','INACTIVE')
     GROUP BY m.member_id, m.membership_no, m.first_name, m.middle_name, m.last_name,
              a.account_id, a.product_code, a.balance, ap.financial_category
     ORDER BY m.membership_no`, [periodEnd, periodEnd]);
  const payoutRows = await runQuery(connection,
    `SELECT a.member_id, a.account_id FROM accounts a
     WHERE a.status = 'ACTIVE' AND a.product_code = ?`, [policy.payout_product_code]);
  const payoutAccounts = new Map();
  for (const row of payoutRows) {
    if (payoutAccounts.has(row.member_id)) throw httpError(409, `Member ${row.member_id} has multiple active payout accounts`);
    payoutAccounts.set(row.member_id, row.account_id);
  }
  const eligibleSavings = new Set(policy.buckets.filter((b) => b.allocation_basis === 'SAVINGS_BALANCE').flatMap((b) => b.eligible_products));
  const shareUnitRows = await runQuery(connection, `SELECT member_id, COALESCE(SUM(unit_delta),0) share_units
    FROM share_unit_entries WHERE effective_at < DATE_ADD(?, INTERVAL 1 DAY) GROUP BY member_id`, [periodEnd]);
  const shareUnitsByMember = new Map(shareUnitRows.map((row) => [row.member_id, unitsToMicros(row.share_units)]));
  const members = new Map();
  for (const row of accountRows) {
    if (!members.has(row.member_id)) members.set(row.member_id, {
      member_id: row.member_id,
      membership_no: row.membership_no,
      member_name: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' '),
      share_balance_cents: 0n,
      share_units: shareUnitsByMember.get(row.member_id) || 0n,
      savings_balance_cents: 0n,
      payout_account_id: payoutAccounts.get(row.member_id) || null
    });
    if (!row.account_id) continue;
    const asOfCents = etbToCents(row.balance) - etbToCents(row.future_net);
    const positive = asOfCents > 0n ? asOfCents : 0n;
    const member = members.get(row.member_id);
    if (row.financial_category === 'SHARE_CAPITAL') member.share_balance_cents += positive;
    if (eligibleSavings.has(row.product_code)) member.savings_balance_cents += positive;
  }
  return [...members.values()];
}

function calculateMemberAllocations(members, shareBucketCents, savingsBucketCents) {
  const shareWeights = members.filter((m) => m.share_units > 0n).map((m) => ({ id: m.member_id, weight: m.share_units }));
  const savingsWeights = members.filter((m) => m.savings_balance_cents > 0n).map((m) => ({ id: m.member_id, weight: m.savings_balance_cents }));
  if (shareBucketCents > 0n && !shareWeights.length) throw httpError(409, 'Profit distribution cannot be generated because the total fractional-share count is zero');
  if (savingsBucketCents > 0n && !savingsWeights.length) throw httpError(409, 'Profit distribution cannot be generated because eligible savings balances total zero');
  const shareAmounts = shareBucketCents > 0n ? allocateLargestRemainder(shareBucketCents, shareWeights) : new Map();
  const savingsAmounts = savingsBucketCents > 0n ? allocateLargestRemainder(savingsBucketCents, savingsWeights) : new Map();
  return members.map((member) => ({
    ...member,
    share_dividend_cents: shareAmounts.get(member.member_id) || 0n,
    savings_dividend_cents: savingsAmounts.get(member.member_id) || 0n,
    total_payout_cents: (shareAmounts.get(member.member_id) || 0n) + (savingsAmounts.get(member.member_id) || 0n)
  })).filter((member) => member.total_payout_cents > 0n || member.share_units > 0n || member.savings_balance_cents > 0n);
}

export async function generateDistribution(payload, actor) {
  assertDate(payload.period_start, 'period_start');
  assertDate(payload.period_end, 'period_end');
  if (payload.period_end < payload.period_start) throw httpError(400, 'period_end cannot be before period_start');
  return withTransaction(async (connection) => {
    await connection.query("SELECT * FROM sacco_master_account WHERE account_key = 'ETB_MASTER' FOR UPDATE");
    const [shareMismatches] = await connection.query(`SELECT a.account_id
      FROM accounts a
      JOIN account_products ap ON ap.product_code = a.product_code
      LEFT JOIN share_unit_entries se ON se.account_id = a.account_id
      WHERE ap.financial_category = 'SHARE_CAPITAL'
      GROUP BY a.account_id, a.balance, a.share_unit_balance
      HAVING a.balance <> COALESCE(SUM(CASE WHEN se.entry_type = 'PURCHASE' THEN se.amount ELSE -se.amount END),0)
        OR a.share_unit_balance <> COALESCE(SUM(se.unit_delta),0)
      LIMIT 1`);
    if (shareMismatches[0]) {
      throw httpError(409, 'Profit distribution is blocked because a Share Capital account does not reconcile with the append-only share ledger');
    }
    const [overlapRows] = await connection.query(
      `SELECT distribution_id FROM profit_distributions
       WHERE status <> 'VOID' AND period_start <= ? AND period_end >= ? LIMIT 1`,
      [payload.period_end, payload.period_start]
    );
    if (overlapRows[0]) throw httpError(409, 'The selected period overlaps an existing non-void profit distribution');
    const policy = await loadPolicy(null, connection);
    const [ledgerTotals] = await connection.query(
      `SELECT
       COALESCE(SUM(CASE WHEN direction = 'INFLOW' THEN amount ELSE 0 END),0) inflows,
       COALESCE(SUM(CASE WHEN direction = 'OUTFLOW' THEN amount ELSE 0 END),0) outflows
       FROM sacco_master_ledger
       WHERE affects_profit = 1 AND entry_date BETWEEN ? AND ? AND posted_at <= NOW()`,
      [payload.period_start, payload.period_end]
    );
    const inflowCents = etbToCents(ledgerTotals[0].inflows);
    const outflowCents = etbToCents(ledgerTotals[0].outflows);
    const netCents = inflowCents - outflowCents;
    if (netCents <= 0n) throw httpError(409, `No distributable net profit exists for this period. Net result: ETB ${centsToEtb(netCents)}`);
    const [shareConfigRows] = await connection.query("SELECT config_value FROM system_config WHERE config_key = 'share_price'");
    const sharePriceCents = etbToCents(shareConfigRows[0]?.config_value || '300');
    if (sharePriceCents <= 0n) throw httpError(409, 'Configured share price must be greater than zero');

    const bucketWeights = [{ id: '__RESERVE__', weight: BigInt(policy.reserve_bps) }, ...policy.buckets.map((bucket) => ({ id: bucket.bucket_code, weight: BigInt(bucket.percentage_bps) }))];
    const bucketAmounts = allocateLargestRemainder(netCents, bucketWeights);
    const shareBucketCents = policy.buckets.filter((b) => b.is_member_payable && b.allocation_basis === 'SHARE_UNITS').reduce((sum, b) => sum + (bucketAmounts.get(b.bucket_code) || 0n), 0n);
    const savingsBucketCents = policy.buckets.filter((b) => b.is_member_payable && b.allocation_basis === 'SAVINGS_BALANCE').reduce((sum, b) => sum + (bucketAmounts.get(b.bucket_code) || 0n), 0n);
    const internalCents = policy.buckets.filter((b) => !b.is_member_payable).reduce((sum, b) => sum + (bucketAmounts.get(b.bucket_code) || 0n), 0n);
    const members = await loadPeriodMemberBalances(connection, payload.period_end, policy);
    const memberAllocations = calculateMemberAllocations(members, shareBucketCents, savingsBucketCents);
    const totalShareUnits = memberAllocations.reduce((sum, member) => sum + member.share_units, 0n);
    const totalSavingsCents = memberAllocations.reduce((sum, member) => sum + member.savings_balance_cents, 0n);
    const distributionId = uuid();
    const snapshot = getPolicySnapshot(policy);
    await connection.execute(
      `INSERT INTO profit_distributions
       (distribution_id, policy_id, period_start, period_end, ledger_cutoff_at, total_inflows, total_outflows,
        net_profit, reserve_amount, member_payout_amount, retained_allocation_amount, share_price,
        total_share_units, total_eligible_savings, policy_snapshot, generated_by)
       VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [distributionId, policy.policy_id, payload.period_start, payload.period_end, centsToEtb(inflowCents), centsToEtb(outflowCents), centsToEtb(netCents),
        centsToEtb(bucketAmounts.get('__RESERVE__')), centsToEtb(shareBucketCents + savingsBucketCents), centsToEtb(internalCents),
        centsToEtb(sharePriceCents), microsToUnits(totalShareUnits), centsToEtb(totalSavingsCents), JSON.stringify(snapshot), actor.userId]
    );
    for (const bucket of policy.buckets) await connection.execute(
      `INSERT INTO profit_distribution_allocations
       (allocation_id, distribution_id, bucket_code, bucket_name, percentage_bps, allocation_basis, is_member_payable, allocated_amount, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), distributionId, bucket.bucket_code, bucket.name, bucket.percentage_bps, bucket.allocation_basis, bucket.is_member_payable ? 1 : 0, centsToEtb(bucketAmounts.get(bucket.bucket_code)), Number(bucket.display_order)]
    );
    for (const member of memberAllocations) await connection.execute(
      `INSERT INTO profit_distribution_member_allocations
       (member_allocation_id, distribution_id, member_id, share_balance, calculated_share_units,
        eligible_savings_balance, share_dividend_amount, savings_dividend_amount, total_payout_amount, payout_account_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), distributionId, member.member_id, centsToEtb(member.share_balance_cents), microsToUnits(member.share_units), centsToEtb(member.savings_balance_cents),
        centsToEtb(member.share_dividend_cents), centsToEtb(member.savings_dividend_cents), centsToEtb(member.total_payout_cents), member.payout_account_id]
    );
    await insertAuditLog({ userId: actor.userId, action: 'GENERATE_PROFIT_DISTRIBUTION', entity: 'profit_distributions', entityId: distributionId, metadata: { period_start: payload.period_start, period_end: payload.period_end, net_profit: centsToEtb(netCents) }, connection });
    return getDistributionById(distributionId, connection);
  });
}

function mapDistribution(row) {
  if (!row) return null;
  const monetary = ['total_inflows','total_outflows','net_profit','reserve_amount','member_payout_amount','retained_allocation_amount','share_price','total_eligible_savings'];
  const mapped = { ...row };
  for (const key of monetary) mapped[key] = money(row[key]);
  // Keep eight-decimal ownership values as strings at the API boundary so
  // JavaScript floating-point conversion cannot alter dividend weights.
  mapped.total_share_units = String(row.total_share_units || '0.00000000');
  mapped.version = Number(row.version || 0);
  if (typeof mapped.policy_snapshot === 'string') mapped.policy_snapshot = JSON.parse(mapped.policy_snapshot);
  return mapped;
}

export async function getDistributionById(distributionId, connection = null) {
  const rows = await runQuery(connection, `SELECT d.*, gp.username generated_by_username, pp.username paid_by_username
    FROM profit_distributions d LEFT JOIN users gp ON gp.user_id = d.generated_by LEFT JOIN users pp ON pp.user_id = d.paid_by
    WHERE d.distribution_id = ?`, [distributionId]);
  if (!rows[0]) throw httpError(404, 'Profit distribution not found');
  const allocations = await runQuery(connection, 'SELECT * FROM profit_distribution_allocations WHERE distribution_id = ? ORDER BY display_order', [distributionId]);
  const members = await runQuery(connection, `SELECT ma.*, m.membership_no,
    CONCAT_WS(' ',m.first_name,m.middle_name,m.last_name) member_name
    FROM profit_distribution_member_allocations ma JOIN members m ON m.member_id = ma.member_id
    WHERE ma.distribution_id = ? ORDER BY m.membership_no`, [distributionId]);
  const votes = await runQuery(connection, `SELECT v.*, u.username, u.email, ru.username resolved_by_username
    FROM profit_distribution_board_votes v JOIN users u ON u.user_id = v.voter_id
    LEFT JOIN users ru ON ru.user_id = v.resolved_by WHERE v.distribution_id = ? ORDER BY u.username`, [distributionId]);
  return {
    ...mapDistribution(rows[0]),
    allocations: allocations.map((row) => ({ ...row, percentage_bps: Number(row.percentage_bps), is_member_payable: Boolean(row.is_member_payable), allocated_amount: money(row.allocated_amount) })),
    members: members.map((row) => ({ ...row, share_balance: money(row.share_balance), calculated_share_units: String(row.calculated_share_units), override_share_units: row.override_share_units === null ? null : String(row.override_share_units), eligible_savings_balance: money(row.eligible_savings_balance), share_dividend_amount: money(row.share_dividend_amount), savings_dividend_amount: money(row.savings_dividend_amount), total_payout_amount: money(row.total_payout_amount) })),
    votes: votes.map((row) => ({ ...row, rejection_resolved: Boolean(row.rejection_resolved) }))
  };
}

export async function listDistributions(filters = {}) {
  const params = [];
  let where = '';
  if (filters.status) { where = 'WHERE status = ?'; params.push(filters.status); }
  const rows = await query(`SELECT * FROM profit_distributions ${where} ORDER BY created_at DESC`, params);
  return rows.map(mapDistribution);
}

async function recalculateShareAllocations(distributionId, connection) {
  const [bucketRows] = await connection.query(`SELECT COALESCE(SUM(allocated_amount),0) amount FROM profit_distribution_allocations
    WHERE distribution_id = ? AND is_member_payable = 1 AND allocation_basis = 'SHARE_UNITS'`, [distributionId]);
  const [members] = await connection.query(`SELECT member_id, calculated_share_units, override_share_units,
    savings_dividend_amount FROM profit_distribution_member_allocations WHERE distribution_id = ? FOR UPDATE`, [distributionId]);
  const weighted = members.map((member) => ({ id: member.member_id, weight: unitsToMicros(member.override_share_units ?? member.calculated_share_units) })).filter((member) => member.weight > 0n);
  if (!weighted.length) throw httpError(409, 'At least one fractional share is required after overrides');
  const amounts = allocateLargestRemainder(etbToCents(bucketRows[0].amount), weighted);
  let totalUnits = 0n;
  for (const member of members) {
    const units = unitsToMicros(member.override_share_units ?? member.calculated_share_units);
    totalUnits += units;
    const shareCents = amounts.get(member.member_id) || 0n;
    const savingsCents = etbToCents(member.savings_dividend_amount);
    await connection.execute(`UPDATE profit_distribution_member_allocations
      SET share_dividend_amount = ?, total_payout_amount = ? WHERE distribution_id = ? AND member_id = ?`,
    [centsToEtb(shareCents), centsToEtb(shareCents + savingsCents), distributionId, member.member_id]);
  }
  await connection.execute('UPDATE profit_distributions SET total_share_units = ?, version = version + 1 WHERE distribution_id = ?', [microsToUnits(totalUnits), distributionId]);
}

export async function overrideMemberShares(distributionId, memberId, payload, actor) {
  let unitMicros;
  try { unitMicros = unitsToMicros(payload.share_units); } catch (_error) { throw httpError(400, 'share_units must be a non-negative value with at most eight decimal places'); }
  const units = microsToUnits(unitMicros);
  const reason = String(payload.reason || '').trim();
  if (reason.length < 10) throw httpError(400, 'An override reason of at least 10 characters is required');
  return withTransaction(async (connection) => {
    const [distributions] = await connection.query('SELECT * FROM profit_distributions WHERE distribution_id = ? FOR UPDATE', [distributionId]);
    if (!distributions[0]) throw httpError(404, 'Profit distribution not found');
    if (distributions[0].status !== 'DRAFT') throw httpError(409, 'Share counts can only be overridden while the distribution is DRAFT');
    const [members] = await connection.query('SELECT * FROM profit_distribution_member_allocations WHERE distribution_id = ? AND member_id = ? FOR UPDATE', [distributionId, memberId]);
    if (!members[0]) throw httpError(404, 'Member allocation not found');
    await connection.execute(`UPDATE profit_distribution_member_allocations SET override_share_units = ?, share_override_reason = ?,
      share_overridden_by = ?, share_overridden_at = NOW() WHERE distribution_id = ? AND member_id = ?`, [units, reason, actor.userId, distributionId, memberId]);
    await recalculateShareAllocations(distributionId, connection);
    await insertAuditLog({ userId: actor.userId, action: 'OVERRIDE_DISTRIBUTION_SHARE_UNITS', entity: 'profit_distribution_member_allocations', entityId: members[0].member_allocation_id, oldValue: { share_units: String(members[0].override_share_units ?? members[0].calculated_share_units) }, newValue: { share_units: units }, metadata: { distribution_id: distributionId, reason }, connection });
    return getDistributionById(distributionId, connection);
  });
}

async function updateReadiness(distributionId, connection) {
  const [distributions] = await connection.query('SELECT policy_snapshot, status FROM profit_distributions WHERE distribution_id = ? FOR UPDATE', [distributionId]);
  const distribution = distributions[0];
  const snapshot = typeof distribution.policy_snapshot === 'string' ? JSON.parse(distribution.policy_snapshot) : distribution.policy_snapshot;
  const [counts] = await connection.query(`SELECT
    SUM(decision = 'APPROVED') approvals,
    SUM(decision = 'REJECTED' AND rejection_resolved = 0) unresolved_rejections
    FROM profit_distribution_board_votes WHERE distribution_id = ?`, [distributionId]);
  const ready = Number(counts[0].approvals || 0) >= Number(snapshot.board_quorum_count) && Number(counts[0].unresolved_rejections || 0) === 0;
  await connection.execute('UPDATE profit_distributions SET status = ?, version = version + 1 WHERE distribution_id = ?', [ready ? 'READY_FOR_PAYOUT' : 'PENDING_BOARD', distributionId]);
  return ready;
}

export async function submitDistribution(distributionId, actor) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query('SELECT * FROM profit_distributions WHERE distribution_id = ? FOR UPDATE', [distributionId]);
    if (!rows[0]) throw httpError(404, 'Profit distribution not found');
    if (rows[0].status !== 'DRAFT') throw httpError(409, 'Only a DRAFT distribution can be submitted');
    const snapshot = typeof rows[0].policy_snapshot === 'string' ? JSON.parse(rows[0].policy_snapshot) : rows[0].policy_snapshot;
    const [board] = await connection.query("SELECT user_id FROM users WHERE role = 'BOARD_MEMBER' AND status = 'ACTIVE' ORDER BY user_id");
    if (board.length < Number(snapshot.board_quorum_count)) throw httpError(409, `At least ${snapshot.board_quorum_count} active Board Members are required before submission`);
    for (const member of board) await connection.execute(`INSERT INTO profit_distribution_board_votes
      (vote_id, distribution_id, voter_id) VALUES (?, ?, ?)`, [uuid(), distributionId, member.user_id]);
    await connection.execute("UPDATE profit_distributions SET status = 'PENDING_BOARD', submitted_by = ?, submitted_at = NOW(), version = version + 1 WHERE distribution_id = ?", [actor.userId, distributionId]);
    await insertAuditLog({ userId: actor.userId, action: 'SUBMIT_PROFIT_DISTRIBUTION', entity: 'profit_distributions', entityId: distributionId, metadata: { board_members: board.length, quorum: snapshot.board_quorum_count }, connection });
    return getDistributionById(distributionId, connection);
  });
}

export async function castBoardVote(distributionId, payload, actor) {
  const decision = payload.decision;
  const reason = String(payload.reason || '').trim();
  if (!['APPROVED', 'REJECTED'].includes(decision)) throw httpError(400, 'decision must be APPROVED or REJECTED');
  if (decision === 'REJECTED' && reason.length < 10) throw httpError(400, 'A rejection reason of at least 10 characters is required');
  return withTransaction(async (connection) => {
    const [rows] = await connection.query('SELECT status FROM profit_distributions WHERE distribution_id = ? FOR UPDATE', [distributionId]);
    if (!rows[0]) throw httpError(404, 'Profit distribution not found');
    if (!['PENDING_BOARD', 'READY_FOR_PAYOUT'].includes(rows[0].status)) throw httpError(409, 'This distribution is not open for Board voting');
    const [votes] = await connection.query('SELECT * FROM profit_distribution_board_votes WHERE distribution_id = ? AND voter_id = ? FOR UPDATE', [distributionId, actor.userId]);
    if (!votes[0]) throw httpError(403, 'You are not assigned to this profit distribution');
    if (votes[0].decision !== 'PENDING') throw httpError(409, 'Your decision has already been recorded');
    await connection.execute('UPDATE profit_distribution_board_votes SET decision = ?, reason = ?, decided_at = NOW() WHERE vote_id = ?', [decision, reason || null, votes[0].vote_id]);
    await updateReadiness(distributionId, connection);
    await insertAuditLog({ userId: actor.userId, action: 'PROFIT_DISTRIBUTION_BOARD_VOTE', entity: 'profit_distributions', entityId: distributionId, metadata: { decision, reason }, connection });
    return getDistributionById(distributionId, connection);
  });
}

export async function resolveBoardRejection(distributionId, voteId, payload, actor) {
  const reason = String(payload.reason || '').trim();
  if (reason.length < 10) throw httpError(400, 'A resolution reason of at least 10 characters is required');
  return withTransaction(async (connection) => {
    const [votes] = await connection.query(`SELECT v.* FROM profit_distribution_board_votes v
      JOIN profit_distributions d ON d.distribution_id = v.distribution_id
      WHERE v.vote_id = ? AND v.distribution_id = ? AND d.status IN ('PENDING_BOARD','READY_FOR_PAYOUT') FOR UPDATE`, [voteId, distributionId]);
    if (!votes[0]) throw httpError(404, 'Open Board rejection was not found');
    if (votes[0].decision !== 'REJECTED' || votes[0].rejection_resolved) throw httpError(409, 'Only an unresolved rejection can be resolved');
    await connection.execute(`UPDATE profit_distribution_board_votes SET rejection_resolved = 1, resolved_by = ?,
      resolution_reason = ?, resolved_at = NOW() WHERE vote_id = ?`, [actor.userId, reason, voteId]);
    await updateReadiness(distributionId, connection);
    await insertAuditLog({ userId: actor.userId, action: 'RESOLVE_PROFIT_DISTRIBUTION_REJECTION', entity: 'profit_distribution_board_votes', entityId: voteId, metadata: { distribution_id: distributionId, reason }, connection });
    return getDistributionById(distributionId, connection);
  });
}

export async function voidDistribution(distributionId, payload, actor) {
  const reason = String(payload.reason || '').trim();
  if (reason.length < 10) throw httpError(400, 'A void reason of at least 10 characters is required');
  return withTransaction(async (connection) => {
    const [rows] = await connection.query('SELECT * FROM profit_distributions WHERE distribution_id = ? FOR UPDATE', [distributionId]);
    if (!rows[0]) throw httpError(404, 'Profit distribution not found');
    if (rows[0].status === 'PAID' || rows[0].status === 'VOID') throw httpError(409, 'Paid or already void distributions cannot be voided');
    await connection.execute("UPDATE profit_distributions SET status = 'VOID', voided_by = ?, void_reason = ?, voided_at = NOW(), version = version + 1 WHERE distribution_id = ?", [actor.userId, reason, distributionId]);
    await insertAuditLog({ userId: actor.userId, action: 'VOID_PROFIT_DISTRIBUTION', entity: 'profit_distributions', entityId: distributionId, metadata: { reason }, connection });
    return getDistributionById(distributionId, connection);
  });
}

export async function validatePayoutReadiness(distributionId) {
  const rows = await query('SELECT * FROM profit_distributions WHERE distribution_id = ?', [distributionId]);
  const distribution = rows[0];
  if (!distribution) throw httpError(404, 'Profit distribution not found');
  if (distribution.status === 'PAID') return { valid: false, failures: ['This distribution has already been paid'], available_balance: '0.00', required_balance: money(distribution.member_payout_amount), recipient_count: 0 };
  const snapshot = typeof distribution.policy_snapshot === 'string' ? JSON.parse(distribution.policy_snapshot) : distribution.policy_snapshot;
  const failures = [];
  if (distribution.status !== 'READY_FOR_PAYOUT') failures.push('Board approval quorum and rejection resolution are not complete');
  const [voteCounts] = await query(`SELECT SUM(decision = 'APPROVED') approvals,
    SUM(decision = 'REJECTED' AND rejection_resolved = 0) unresolved
    FROM profit_distribution_board_votes WHERE distribution_id = ?`, [distributionId]);
  if (Number(voteCounts.approvals || 0) < Number(snapshot.board_quorum_count)) failures.push(`At least ${snapshot.board_quorum_count} affirmative Board votes are required`);
  if (Number(voteCounts.unresolved || 0) > 0) failures.push('All Board rejections must be resolved by Admin');
  const members = await query(`SELECT ma.member_id, m.membership_no, m.status member_status,
      COUNT(a.account_id) active_payout_accounts
    FROM profit_distribution_member_allocations ma
    JOIN members m ON m.member_id = ma.member_id
    LEFT JOIN accounts a ON a.member_id = ma.member_id AND a.product_code = ? AND a.status = 'ACTIVE'
    WHERE ma.distribution_id = ? AND ma.total_payout_amount > 0
    GROUP BY ma.member_id, m.membership_no, m.status`, [snapshot.payout_product_code, distributionId]);
  for (const member of members) {
    if (!['ACTIVE', 'INACTIVE'].includes(member.member_status)) failures.push(`${member.membership_no}: member status is ${member.member_status}`);
    if (Number(member.active_payout_accounts) !== 1) failures.push(`${member.membership_no}: requires exactly one active ${snapshot.payout_product_code} account`);
  }
  const [master] = await query("SELECT balance FROM sacco_master_account WHERE account_key = 'ETB_MASTER'");
  const availableCents = etbToCents(master?.balance || 0);
  const requiredCents = etbToCents(distribution.member_payout_amount);
  if (availableCents < requiredCents) failures.push(`Insufficient master balance: ETB ${centsToEtb(availableCents)} available; ETB ${centsToEtb(requiredCents)} required`);
  return {
    valid: failures.length === 0,
    failures,
    available_balance: centsToEtb(availableCents),
    required_balance: centsToEtb(requiredCents),
    recipient_count: members.length
  };
}

async function reconciliationCandidates(connection = null, filters = {}) {
  if (filters.date_from) assertDate(filters.date_from, 'date_from');
  if (filters.date_to) assertDate(filters.date_to, 'date_to');
  if (filters.date_from && filters.date_to && filters.date_to < filters.date_from) throw httpError(400, 'date_to cannot be before date_from');
  const dateClause = (column) => `${filters.date_from ? ` AND ${column} >= ?` : ''}${filters.date_to ? ` AND ${column} <= ?` : ''}`;
  const dateParams = () => [filters.date_from, filters.date_to].filter(Boolean);
  const repayments = await runQuery(connection, `SELECT lr.repayment_id, lr.loan_id, lr.payment_date,
      lr.interest_paid, lr.penalty_paid, lr.performed_by,
      li.ledger_id interest_ledger_id, lp.ledger_id penalty_ledger_id
    FROM loan_repayments lr
    LEFT JOIN sacco_master_ledger li ON li.source_type = 'LOAN_REPAYMENT' AND li.source_id = lr.repayment_id AND li.source_component = 'INTEREST'
    LEFT JOIN sacco_master_ledger lp ON lp.source_type = 'LOAN_REPAYMENT' AND lp.source_id = lr.repayment_id AND lp.source_component = 'PENALTY'
    WHERE ((lr.interest_paid > 0 AND li.ledger_id IS NULL) OR (lr.penalty_paid > 0 AND lp.ledger_id IS NULL))
    ${dateClause('lr.payment_date')} ORDER BY lr.payment_date, lr.repayment_id`, dateParams());
  const postings = await runQuery(connection, `SELECT ip.posting_id, ip.posting_date, ip.interest_amount,
      ip.account_id, a.product_code
    FROM interest_postings ip
    JOIN accounts a ON a.account_id = ip.account_id
    LEFT JOIN sacco_master_ledger l ON l.source_type = 'INTEREST_POSTING' AND l.source_id = ip.posting_id AND l.source_component = 'SAVINGS_INTEREST'
    WHERE ip.interest_amount > 0 AND l.ledger_id IS NULL
    ${dateClause('ip.posting_date')} ORDER BY ip.posting_date, ip.posting_id`, dateParams());
  const entries = [];
  for (const row of repayments) {
    if (Number(row.interest_paid) > 0 && !row.interest_ledger_id) entries.push({ entry_date: row.payment_date, direction: 'INFLOW', entry_type: 'LOAN_INTEREST', amount: money(row.interest_paid), source_type: 'LOAN_REPAYMENT', source_id: row.repayment_id, source_component: 'INTEREST', performed_by: row.performed_by, description: `Historical interest collected for loan ${row.loan_id}` });
    if (Number(row.penalty_paid) > 0 && !row.penalty_ledger_id) entries.push({ entry_date: row.payment_date, direction: 'INFLOW', entry_type: 'LOAN_PENALTY', amount: money(row.penalty_paid), source_type: 'LOAN_REPAYMENT', source_id: row.repayment_id, source_component: 'PENALTY', performed_by: row.performed_by, description: `Historical penalty collected for loan ${row.loan_id}` });
  }
  for (const row of postings) entries.push({ entry_date: row.posting_date, direction: 'OUTFLOW', entry_type: 'SAVINGS_INTEREST', amount: money(row.interest_amount), source_type: 'INTEREST_POSTING', source_id: row.posting_id, source_component: 'SAVINGS_INTEREST', performed_by: null, description: `Historical savings interest for ${row.product_code} account ${row.account_id}` });
  entries.sort((a, b) => String(a.entry_date).localeCompare(String(b.entry_date)) || (a.direction === b.direction ? a.source_id.localeCompare(b.source_id) : a.direction === 'INFLOW' ? -1 : 1));
  return entries;
}

function summarizeReconciliation(entries) {
  let inflowCents = 0n;
  let outflowCents = 0n;
  for (const entry of entries) {
    if (entry.direction === 'INFLOW') inflowCents += etbToCents(entry.amount);
    else outflowCents += etbToCents(entry.amount);
  }
  return { entry_count: entries.length, inflow_total: centsToEtb(inflowCents), outflow_total: centsToEtb(outflowCents), net_change: centsToEtb(inflowCents - outflowCents) };
}

export async function previewHistoricalReconciliation(filters = {}) {
  const entries = await reconciliationCandidates(null, filters);
  return { ...summarizeReconciliation(entries), entries };
}

export async function importHistoricalReconciliation(payload, actor) {
  if (payload.confirm !== true) throw httpError(400, 'confirm must be true; run the reconciliation preview and verify every source first');
  return withTransaction(async (connection) => {
    const entries = await reconciliationCandidates(connection, payload);
    for (const entry of entries) await postMasterEntry(connection, {
      entryDate: entry.entry_date, direction: entry.direction, entryType: entry.entry_type,
      amount: entry.amount, affectsProfit: true, sourceType: entry.source_type, sourceId: entry.source_id,
      sourceComponent: entry.source_component, performedBy: entry.performed_by,
      description: entry.description, idempotencyKey: `RECONCILED:${entry.source_type}:${entry.source_id}:${entry.source_component}`
    });
    const summary = summarizeReconciliation(entries);
    await insertAuditLog({ userId: actor.userId, action: 'IMPORT_MASTER_LEDGER_RECONCILIATION', entity: 'sacco_master_ledger', entityId: null, metadata: { ...summary, date_from: payload.date_from || null, date_to: payload.date_to || null }, connection });
    return { ...summary, imported: entries.length };
  });
}

export async function payoutDistribution(distributionId, payload, actor) {
  const idempotencyKey = String(payload.idempotency_key || '').trim();
  if (!idempotencyKey) throw httpError(400, 'idempotency_key is required');
  return withTransaction(async (connection) => {
    const [rows] = await connection.query('SELECT * FROM profit_distributions WHERE distribution_id = ? FOR UPDATE', [distributionId]);
    const distribution = rows[0];
    if (!distribution) throw httpError(404, 'Profit distribution not found');
    if (distribution.status === 'PAID') return getDistributionById(distributionId, connection);
    if (distribution.status !== 'READY_FOR_PAYOUT') throw httpError(409, 'Board quorum and rejection resolution must be complete before payout');
    const snapshot = typeof distribution.policy_snapshot === 'string' ? JSON.parse(distribution.policy_snapshot) : distribution.policy_snapshot;
    const [voteCounts] = await connection.query(`SELECT SUM(decision = 'APPROVED') approvals,
      SUM(decision = 'REJECTED' AND rejection_resolved = 0) unresolved FROM profit_distribution_board_votes WHERE distribution_id = ?`, [distributionId]);
    if (Number(voteCounts[0].approvals || 0) < Number(snapshot.board_quorum_count) || Number(voteCounts[0].unresolved || 0) > 0) throw httpError(409, 'Board approval requirements are not satisfied');
    const [members] = await connection.query(`SELECT ma.*, m.status member_status FROM profit_distribution_member_allocations ma
      JOIN members m ON m.member_id = ma.member_id WHERE ma.distribution_id = ? AND ma.total_payout_amount > 0 ORDER BY ma.member_id FOR UPDATE`, [distributionId]);
    const failures = [];
    for (const member of members) {
      if (!['ACTIVE', 'INACTIVE'].includes(member.member_status)) failures.push(`${member.member_id}: member status is ${member.member_status}`);
      const [accounts] = await connection.query(`SELECT * FROM accounts WHERE member_id = ? AND product_code = ? AND status = 'ACTIVE' FOR UPDATE`, [member.member_id, snapshot.payout_product_code]);
      if (accounts.length !== 1) failures.push(`${member.member_id}: requires exactly one active ${snapshot.payout_product_code} account`);
      else member.target_account = accounts[0];
    }
    if (failures.length) throw httpError(409, 'Dividend payout validation failed', { failures });
    const totalPayoutCents = members.reduce((sum, member) => sum + etbToCents(member.total_payout_amount), 0n);
    if (totalPayoutCents !== etbToCents(distribution.member_payout_amount)) throw httpError(409, 'Member allocation total does not match the approved payout total');
    for (const member of members) {
      const amountCents = etbToCents(member.total_payout_amount);
      const balanceCents = etbToCents(member.target_account.balance) + amountCents;
      const txnId = uuid();
      await connection.execute('UPDATE accounts SET balance = ?, version = version + 1, updated_at = NOW() WHERE account_id = ?', [centsToEtb(balanceCents), member.target_account.account_id]);
      await connection.execute(`INSERT INTO transactions
        (txn_id, account_id, txn_type, amount, balance_after, reference, performed_by, idempotency_key)
        VALUES (?, ?, 'DEPOSIT', ?, ?, ?, ?, ?)`,
      [txnId, member.target_account.account_id, centsToEtb(amountCents), centsToEtb(balanceCents), `Profit distribution ${distributionId}`, actor.userId, `DIVIDEND:${distributionId}:${member.member_id}`]);
      await connection.execute(`UPDATE profit_distribution_member_allocations SET payout_account_id = ?, payout_transaction_id = ?,
        payout_status = 'PAID' WHERE member_allocation_id = ?`, [member.target_account.account_id, txnId, member.member_allocation_id]);
    }
    const ledgerResult = await postMasterEntry(connection, {
      entryDate: addisAbabaDate(), direction: 'OUTFLOW', entryType: 'DIVIDEND_PAYOUT',
      amount: centsToEtb(totalPayoutCents), affectsProfit: false, sourceType: 'PROFIT_DISTRIBUTION', sourceId: distributionId,
      sourceComponent: 'MEMBER_PAYOUT', distributionId, performedBy: actor.userId,
      description: `Member dividend payout for ${distribution.period_start} through ${distribution.period_end}`,
      idempotencyKey
    });
    await connection.execute(`UPDATE profit_distributions SET status = 'PAID', paid_by = ?, paid_at = NOW(), payout_ledger_id = ?,
      version = version + 1 WHERE distribution_id = ?`, [actor.userId, ledgerResult.entry.ledger_id, distributionId]);
    await insertAuditLog({ userId: actor.userId, action: 'PAYOUT_PROFIT_DISTRIBUTION', entity: 'profit_distributions', entityId: distributionId, metadata: { member_count: members.length, amount: centsToEtb(totalPayoutCents), ledger_id: ledgerResult.entry.ledger_id }, connection });
    return getDistributionById(distributionId, connection);
  });
}
