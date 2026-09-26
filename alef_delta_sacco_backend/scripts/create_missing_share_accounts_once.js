import dotenv from 'dotenv';
import { v4 as uuid } from 'uuid';
import sequelize, { query, withTransaction } from '../src/core/db.js';
import { insertAuditLog } from '../src/modules/admin/audit.repository.js';

dotenv.config();

function flag(name) {
  return process.argv.includes(name);
}

function value(name) {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const duplicates = await query(`SELECT member_id, COUNT(*) account_count
    FROM accounts WHERE product_code = 'SHR_CAP' AND status <> 'CLOSED'
    GROUP BY member_id HAVING COUNT(*) > 1`);
  if (duplicates.length) throw new Error(`Safety check failed: ${duplicates.length} member(s) have duplicate active SHR_CAP accounts`);

  const inconsistent = await query(`SELECT COUNT(*) count FROM accounts a
    LEFT JOIN share_unit_entries se ON se.account_id = a.account_id
    WHERE a.product_code = 'SHR_CAP' AND (a.balance <> 0 OR a.share_unit_balance <> 0)
    GROUP BY a.account_id HAVING COUNT(se.share_entry_id) = 0`);
  if (inconsistent.length) throw new Error(`Safety check failed: ${inconsistent.length} non-zero SHR_CAP account(s) have no share ledger`);

  const missing = await query(`SELECT m.member_id FROM members m
    LEFT JOIN accounts a ON a.member_id = m.member_id AND a.product_code = 'SHR_CAP' AND a.status <> 'CLOSED'
    WHERE a.account_id IS NULL AND m.status NOT IN ('CLOSED','TERMINATED')
    ORDER BY m.member_id`);
  console.log(`Missing Share Capital accounts: ${missing.length}`);
  if (!flag('--execute')) {
    console.log('Preview only. No account was created.');
    console.log(`To execute this exact count, rerun with --execute --expected-count=${missing.length}`);
    return;
  }
  const expected = Number(value('--expected-count'));
  if (!Number.isInteger(expected) || expected !== missing.length) {
    throw new Error(`Safety check failed: expected ${expected} missing accounts but found ${missing.length}. Run preview again.`);
  }
  await withTransaction(async (connection) => {
    const [productRows] = await connection.query(`SELECT product_code FROM account_products
      WHERE product_code = 'SHR_CAP' AND is_active = 1 AND financial_category = 'SHARE_CAPITAL' FOR UPDATE`);
    if (!productRows[0]) throw new Error('Active SHR_CAP product is missing or incorrectly categorized');
    for (const member of missing) {
      const accountId = uuid();
      await connection.execute(`INSERT INTO accounts
        (account_id, member_id, product_code, balance, share_unit_balance, lien_amount, currency, interest_method, status, version, created_at)
        VALUES (?, ?, 'SHR_CAP', 0, 0, 0, 'ETB', 'PROFIT_SHARING', 'ACTIVE', 1, NOW())`, [accountId, member.member_id]);
      await insertAuditLog({
        userId: null,
        action: 'SHARE_ACCOUNT_BOOTSTRAPPED',
        entity: 'accounts',
        entityId: accountId,
        metadata: { member_id: member.member_id, product_code: 'SHR_CAP', opening_balance: '0.00', opening_units: '0.00000000' },
        connection
      });
    }
  });
  console.log(`Created ${missing.length} zero-balance Share Capital account(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  await sequelize.close();
});
