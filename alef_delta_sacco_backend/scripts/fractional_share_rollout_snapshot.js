import fs from 'node:fs/promises';
import path from 'node:path';
import sequelize, { query } from '../src/core/db.js';
import config from '../src/core/config.js';

const assertReady = process.argv.includes('--assert-ready');
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const outputPath = outputArg ? path.resolve(outputArg.slice('--output='.length)) : null;

async function scalar(sql, params = []) {
  const rows = await query(sql, params);
  return Number(rows[0]?.value ?? rows[0]?.count ?? 0);
}

async function tableExists(tableName) {
  return (await scalar(`SELECT COUNT(*) value FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, [config.db.database, tableName])) === 1;
}

async function columnExists(tableName, columnName) {
  return (await scalar(`SELECT COUNT(*) value FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [config.db.database, tableName, columnName])) === 1;
}

async function countFiles(root) {
  let files = 0;
  let bytes = 0;
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile()) {
        files += 1;
        bytes += (await fs.stat(target)).size;
      }
    }
  }
  await walk(root);
  return { files, bytes };
}

async function main() {
  const hasShareUnits = await columnExists('accounts', 'share_unit_balance');
  const hasShareLedger = await tableExists('share_unit_entries');
  const [entityCounts, balancesByProduct, masterAccount, masterLedger, shareProduct, attachments] = await Promise.all([
    Promise.all(['members', 'accounts', 'transactions', 'loan_applications'].map(async (table) => [table, await scalar(`SELECT COUNT(*) value FROM ${table}`)])),
    query(`SELECT product_code, COUNT(*) account_count, CAST(COALESCE(SUM(balance),0) AS CHAR) total_balance
      FROM accounts GROUP BY product_code ORDER BY product_code`),
    tableExists('sacco_master_account').then((exists) => exists
      ? query(`SELECT account_key, currency, CAST(balance AS CHAR) balance, version FROM sacco_master_account ORDER BY account_key`)
      : []),
    tableExists('sacco_master_ledger').then((exists) => exists
      ? query(`SELECT COUNT(*) entry_count,
          CAST(COALESCE(SUM(CASE WHEN direction='INFLOW' THEN amount ELSE 0 END),0) AS CHAR) total_inflows,
          CAST(COALESCE(SUM(CASE WHEN direction='OUTFLOW' THEN amount ELSE 0 END),0) AS CHAR) total_outflows
        FROM sacco_master_ledger`)
      : []),
    query(`SELECT product_code, is_active, financial_category, interest_method, CAST(interest_rate AS CHAR) interest_rate
      FROM account_products WHERE product_code = 'SHR_CAP'`),
    countFiles(config.uploads.root)
  ]);

  const duplicateActiveShareMembers = await scalar(`SELECT COUNT(*) value FROM (
    SELECT member_id FROM accounts WHERE product_code = 'SHR_CAP' AND status <> 'CLOSED'
    GROUP BY member_id HAVING COUNT(*) > 1
  ) duplicates`);
  const missingShareAccounts = await scalar(`SELECT COUNT(*) value FROM members m
    LEFT JOIN accounts a ON a.member_id = m.member_id AND a.product_code = 'SHR_CAP' AND a.status <> 'CLOSED'
    WHERE a.account_id IS NULL AND m.status NOT IN ('CLOSED','TERMINATED')`);
  const nonzeroShareAccounts = await scalar(`SELECT COUNT(*) value FROM accounts
    WHERE product_code = 'SHR_CAP' AND balance <> 0`);
  let nonzeroWithoutLedger = nonzeroShareAccounts;
  let shareLedger = { entry_count: 0, net_units: '0.00000000', purchase_amount: '0.00', redemption_amount: '0.00' };
  if (hasShareLedger && hasShareUnits) {
    nonzeroWithoutLedger = await scalar(`SELECT COUNT(*) value FROM (
      SELECT a.account_id FROM accounts a
      LEFT JOIN share_unit_entries se ON se.account_id = a.account_id
      WHERE a.product_code = 'SHR_CAP' AND (a.balance <> 0 OR a.share_unit_balance <> 0)
      GROUP BY a.account_id HAVING COUNT(se.share_entry_id) = 0
    ) inconsistent`);
    const rows = await query(`SELECT COUNT(*) entry_count,
        CAST(COALESCE(SUM(unit_delta),0) AS CHAR) net_units,
        CAST(COALESCE(SUM(CASE WHEN entry_type='PURCHASE' THEN amount ELSE 0 END),0) AS CHAR) purchase_amount,
        CAST(COALESCE(SUM(CASE WHEN entry_type='REDEMPTION' THEN amount ELSE 0 END),0) AS CHAR) redemption_amount
      FROM share_unit_entries`);
    shareLedger = rows[0];
  }

  const blockers = [];
  const warnings = [];
  if (hasShareLedger !== hasShareUnits) blockers.push('Migration 49 is partially applied: share ledger table and account share-unit column are inconsistent');
  if (shareProduct.length !== 1) {
    if (hasShareLedger || hasShareUnits) blockers.push('SHR_CAP product is missing after migration 49');
    else warnings.push('SHR_CAP product is absent and will be created by migration 49 with a zero opening balance');
  }
  if (shareProduct[0] && (Number(shareProduct[0].is_active) !== 1 || shareProduct[0].financial_category !== 'SHARE_CAPITAL')) {
    blockers.push('SHR_CAP must be active and categorized as SHARE_CAPITAL');
  }
  if (duplicateActiveShareMembers > 0) blockers.push(`${duplicateActiveShareMembers} member(s) have duplicate active SHR_CAP accounts`);
  if (nonzeroWithoutLedger > 0) blockers.push(`${nonzeroWithoutLedger} non-zero SHR_CAP account(s) have no share-unit ledger and require manual reconciliation`);

  const snapshot = {
    captured_at: new Date().toISOString(),
    database: config.db.database,
    migration_49_schema_present: hasShareUnits && hasShareLedger,
    entity_counts: Object.fromEntries(entityCounts),
    balances_by_product: balancesByProduct,
    master_account: masterAccount,
    master_ledger: masterLedger[0] || { entry_count: 0, total_inflows: '0.00', total_outflows: '0.00' },
    attachments,
    share_capital: {
      product: shareProduct[0] || null,
      active_account_count: await scalar(`SELECT COUNT(*) value FROM accounts WHERE product_code = 'SHR_CAP' AND status <> 'CLOSED'`),
      missing_account_count: missingShareAccounts,
      duplicate_member_count: duplicateActiveShareMembers,
      nonzero_account_count: nonzeroShareAccounts,
      nonzero_without_ledger_count: nonzeroWithoutLedger,
      ledger: shareLedger
    },
    warnings,
    blockers
  };
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, serialized, { mode: 0o600 });
    console.log(`Financial rollout snapshot written to ${outputPath}`);
  } else {
    console.log(serialized.trimEnd());
  }
  if (assertReady && blockers.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error.message }));
  process.exitCode = 1;
}).finally(async () => {
  await sequelize.close();
});
