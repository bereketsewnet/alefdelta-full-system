import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import {
  findAccountById,
  listAccountsByMember,
  listAccounts,
  countAccounts,
  createAccount as createAccountRepo,
  updateAccount as updateAccountRepo
} from './account.repository.js';
import { findMemberById } from '../members/member.repository.js';
import { findAccountProductByCode } from '../account-products/account-product.repository.js';
import { query, execute, withTransaction } from '../../core/db.js';
import { insertAuditLog } from '../admin/audit.repository.js';

export const DEFAULT_MEMBER_SAVINGS_PRODUCT_CODES = ['SAV_VOLUNTARY', 'SAV_COMPULSORY'];

function parseMetadata(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }
  return raw;
}

function addComputedFields(account) {
  if (!account) return null;
  return {
    ...account,
    metadata: parseMetadata(account.metadata),
    available_balance: Number(account.balance) - Number(account.lien_amount || 0)
  };
}

function buildAccountMetadata(product, input = {}) {
  const metadata = {};
  const guardian = {};
  const commodity = {};
  const micro = {};

  const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);
  const guardianInput = input.guardian || {};
  const commodityInput = input.in_kind || {};
  const microInput = input.micro || {};
  const guardianName = trimmed(input.guardian_name ?? guardianInput.name);
  const guardianRelationship = trimmed(input.guardian_relationship ?? guardianInput.relationship);
  const guardianPhone = trimmed(input.guardian_phone ?? guardianInput.phone);
  const commodityTypeInput = trimmed(input.commodity_type ?? commodityInput.type);
  const commodityQuantityInput = input.commodity_quantity ?? commodityInput.quantity;
  const commodityUnitInput = trimmed(input.commodity_unit ?? commodityInput.unit);
  const estimatedValueInput = input.estimated_value ?? commodityInput.estimated_value;
  const targetAmountInput = input.target_amount ?? microInput.target_amount;
  const targetDateInput = input.target_date ?? microInput.target_date;

  if (product.guardian_required || guardianName || guardianPhone) {
    guardian.name = guardianName || null;
    guardian.relationship = guardianRelationship || null;
    guardian.phone = guardianPhone || null;
    if (product.guardian_required && !guardian.name) {
      throw httpError(400, 'Guardian name is required for this account product');
    }
    metadata.guardian = guardian;
  }

  if (product.commodity_required || commodityTypeInput) {
    const commodityType = commodityTypeInput || product.default_commodity_type || null;
    const quantity = commodityQuantityInput !== undefined ? Number(commodityQuantityInput) : null;
    const unit = commodityUnitInput || null;
    const estimatedValue = estimatedValueInput !== undefined ? Number(estimatedValueInput) : null;
    if (product.commodity_required && !commodityType) {
      throw httpError(400, 'Commodity type is required for in-kind savings');
    }
    if (product.commodity_required && (!quantity || quantity <= 0)) {
      throw httpError(400, 'Commodity quantity must be greater than zero');
    }
    commodity.type = commodityType;
    if (quantity !== null && !Number.isNaN(quantity)) {
      commodity.quantity = quantity;
    }
    if (unit) {
      commodity.unit = unit;
    }
    if (estimatedValue !== null && !Number.isNaN(estimatedValue)) {
      commodity.estimated_value = estimatedValue;
    }
    metadata.in_kind = commodity;
  }

  if (product.product_kind === 'MICRO' || product.target_required) {
    const targetAmount = targetAmountInput !== undefined ? Number(targetAmountInput) : null;
    if (product.target_required && (!targetAmount || targetAmount <= 0)) {
      throw httpError(400, 'Target amount is required for micro-savings products');
    }
    if (targetAmount !== null && !Number.isNaN(targetAmount)) {
      micro.target_amount = targetAmount;
    }
    if (targetDateInput) {
      micro.target_date = targetDateInput;
    }
    metadata.micro = micro;
  }

  if (input.additional_notes) {
    metadata.notes = trimmed(input.additional_notes);
  }

  return Object.keys(metadata).length ? metadata : null;
}

export async function getAccounts(filters) {
  const data = await listAccounts(filters);
  const total = await countAccounts(filters);
  
  const enriched = data.map(addComputedFields);
  
  return {
    data: enriched,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0
  };
}

export async function getAccountById(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  return addComputedFields(account);
}

export async function getAccountsForMember(memberId) {
  const accounts = await listAccountsByMember(memberId);
  return accounts.map(addComputedFields);
}

export async function createAccount(payload, actor = null) {
  const accountId = uuid();
  await withTransaction(async (connection) => {
    const member = await findMemberById(payload.member_id, connection, true);
    if (!member) throw httpError(404, 'Member not found');
    if (member.status === 'SUSPENDED' || member.status === 'CLOSED') {
      throw httpError(400, 'Cannot open account for suspended or closed members');
    }

    const product = await findAccountProductByCode(payload.product_code);
    if (!product) throw httpError(404, `Account product '${payload.product_code}' not found`);
    if (!product.is_active) throw httpError(400, `Account product '${payload.product_code}' is not active`);

    const [existing] = await connection.query(
      'SELECT account_id FROM accounts WHERE member_id = ? AND product_code = ? AND status != ? LIMIT 1',
      [payload.member_id, payload.product_code, 'CLOSED']
    );
    if (existing.length > 0) throw httpError(400, 'Member already has an active account with this product');

    const metadata = buildAccountMetadata(product, payload.metadata || {});
    await createAccountRepo({
      account_id: accountId,
      member_id: payload.member_id,
      product_code: payload.product_code,
      currency: payload.currency || 'ETB',
      balance: 0,
      lien_amount: 0,
      metadata,
      interest_method: product.interest_method || 'STANDARD',
      status: 'ACTIVE'
    }, connection);
    await insertAuditLog({
      userId: actor?.userId || null,
      action: 'CREATE_MEMBER_ACCOUNT',
      entity: 'accounts',
      entityId: accountId,
      metadata: { member_id: payload.member_id, product_code: payload.product_code },
      connection
    });
  });
  return getAccountById(accountId);
}

export async function ensureMemberSavingsAccounts(memberId, productCodes, actor = null, existingConnection = null) {
  const usingDefaultProducts = productCodes === undefined;
  let requestedCodes = [...new Set(
    (productCodes === undefined ? DEFAULT_MEMBER_SAVINGS_PRODUCT_CODES : productCodes)
      .map((code) => String(code || '').trim())
      .filter(Boolean)
  )];

  const ensure = async (connection) => {
    const member = await findMemberById(memberId, connection, true);
    if (!member) throw httpError(404, 'Member not found');
    if (member.status === 'SUSPENDED' || member.status === 'CLOSED') {
      throw httpError(400, 'Cannot open accounts for suspended or closed members');
    }
    if (requestedCodes.length === 0) return { created: [], existing: [] };

    const productPlaceholders = requestedCodes.map(() => '?').join(',');
    const [products] = await connection.query(
      `SELECT * FROM account_products
       WHERE product_code IN (${productPlaceholders}) AND is_active = 1
         AND (category = 'SAVINGS' OR financial_category IN ('COMPULSORY_SAVINGS','VOLUNTARY_SAVINGS'))`,
      requestedCodes
    );
    const productsByCode = new Map(products.map((product) => [product.product_code, product]));
    const invalidCodes = requestedCodes.filter((code) => !productsByCode.has(code));
    if (invalidCodes.length && !usingDefaultProducts) {
      throw httpError(400, `Inactive, missing, or non-savings account product(s): ${invalidCodes.join(', ')}`);
    }
    if (usingDefaultProducts) requestedCodes = requestedCodes.filter((code) => productsByCode.has(code));
    if (requestedCodes.length === 0) return { created: [], existing: [] };

    const incompatible = products.filter((product) => product.guardian_required || product.commodity_required || product.target_required || ['CHILDREN', 'IN_KIND', 'MICRO'].includes(product.product_kind));
    if (incompatible.length) {
      throw httpError(400, `These products require additional information and must be opened separately: ${incompatible.map((product) => product.product_code).join(', ')}`);
    }

    const accountPlaceholders = requestedCodes.map(() => '?').join(',');
    const [existingRows] = await connection.query(
      `SELECT account_id, product_code FROM accounts
       WHERE member_id = ? AND product_code IN (${accountPlaceholders}) AND status != 'CLOSED'`,
      [memberId, ...requestedCodes]
    );
    const existingCodes = new Set(existingRows.map((account) => account.product_code));
    const created = [];
    for (const productCode of requestedCodes) {
      if (existingCodes.has(productCode)) continue;
      const product = productsByCode.get(productCode);
      const accountId = uuid();
      await createAccountRepo({
        account_id: accountId,
        member_id: memberId,
        product_code: productCode,
        currency: 'ETB',
        balance: 0,
        lien_amount: 0,
        metadata: null,
        interest_method: product.interest_method || 'STANDARD',
        status: 'ACTIVE'
      }, connection);
      await insertAuditLog({
        userId: actor?.userId || null,
        action: 'AUTO_CREATE_MEMBER_SAVINGS_ACCOUNT',
        entity: 'accounts',
        entityId: accountId,
        metadata: { member_id: memberId, product_code: productCode },
        connection
      });
      created.push({ account_id: accountId, product_code: productCode });
    }
    return { created, existing: [...existingCodes] };
  };

  if (existingConnection) return ensure(existingConnection);
  const result = await withTransaction(ensure);
  return { ...result, accounts: await getAccountsForMember(memberId) };
}

export async function updateAccount(accountId, payload) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  
  // Cannot modify closed accounts
  if (account.status === 'CLOSED') {
    throw httpError(400, 'Cannot modify closed account');
  }
  
  // Validate product_code change
  if (payload.product_code && payload.product_code !== account.product_code) {
    const balance = Number(account.balance);
    if (balance !== 0) {
      throw httpError(400, 'Cannot change product code for account with non-zero balance');
    }
    
    // Verify new account product exists and is active
    const product = await findAccountProductByCode(payload.product_code);
    if (!product) {
      throw httpError(404, `Account product '${payload.product_code}' not found`);
    }
    if (!product.is_active) {
      throw httpError(400, `Account product '${payload.product_code}' is not active`);
    }
    
    // Check if member already has an account with the new product code
    const existing = await query(
      'SELECT * FROM accounts WHERE member_id = ? AND product_code = ? AND account_id != ? AND status != ?',
      [account.member_id, payload.product_code, accountId, 'CLOSED']
    );
    
    if (existing.length > 0) {
      throw httpError(400, 'Member already has an active account with this product');
    }
  }
  
  // Validate status transitions
  if (payload.status) {
    if (payload.status === 'CLOSED' && Number(account.balance) !== 0) {
      throw httpError(400, 'Cannot close account with non-zero balance');
    }
  }
  
  if (payload.metadata) {
    const productForValidation = payload.product_code && payload.product_code !== account.product_code
      ? await findAccountProductByCode(payload.product_code)
      : await findAccountProductByCode(account.product_code);
    payload.metadata = buildAccountMetadata(productForValidation, payload.metadata);
  }
  
  await updateAccountRepo(accountId, payload);
  return getAccountById(accountId);
}

export async function closeAccount(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  
  if (account.status === 'CLOSED') {
    throw httpError(400, 'Account is already closed');
  }
  
  const balance = Number(account.balance);
  if (balance !== 0) {
    throw httpError(400, `Cannot close account with non-zero balance. Current balance: ${balance}`);
  }
  
  const lien = Number(account.lien_amount || 0);
  if (lien > 0) {
    throw httpError(400, `Cannot close account with active lien. Lien amount: ${lien}`);
  }
  
  await updateAccountRepo(accountId, { status: 'CLOSED' });
  return getAccountById(accountId);
}

export async function freezeAccount(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  
  if (account.status === 'CLOSED') {
    throw httpError(400, 'Cannot freeze closed account');
  }
  
  await updateAccountRepo(accountId, { status: 'FROZEN' });
  return getAccountById(accountId);
}

export async function unfreezeAccount(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  
  if (account.status !== 'FROZEN') {
    throw httpError(400, 'Account is not frozen');
  }
  
  await updateAccountRepo(accountId, { status: 'ACTIVE' });
  return getAccountById(accountId);
}

export async function deleteAccount(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  
  if (account.status !== 'CLOSED') {
    throw httpError(400, 'Account must be closed before deletion');
  }
  
  const balance = Number(account.balance);
  if (balance !== 0) {
    throw httpError(400, `Cannot delete account with non-zero balance. Current balance: ${balance}`);
  }
  
  const lien = Number(account.lien_amount || 0);
  if (lien > 0) {
    throw httpError(400, `Cannot delete account with active lien. Lien amount: ${lien}`);
  }
  
  // Check if account has any transactions
  const transactions = await query(
    'SELECT COUNT(*) as count FROM transactions WHERE account_id = ?',
    [accountId]
  );
  
  if (transactions[0].count > 0) {
    throw httpError(400, 'Cannot delete account with transaction history. Account must remain for audit purposes.');
  }
  
  await execute('DELETE FROM accounts WHERE account_id = ?', [accountId]);
  return { success: true, message: 'Account deleted successfully' };
}

export async function updateAccountBalance(accountId, expectedVersion, updates, connection) {
  if (!connection) {
    throw new Error('Connection required for balance update');
  }
  const fields = ['balance = ?'];
  const params = [updates.balance];
  if (typeof updates.lien_amount === 'number') {
    fields.push('lien_amount = ?');
    params.push(updates.lien_amount);
  }
  params.push(accountId, expectedVersion);
  const [result] = await connection.execute(
    `UPDATE accounts SET ${fields.join(', ')}, version = version + 1
     WHERE account_id = ? AND version = ?`,
    params
  );
  if (result.affectedRows === 0) {
    const [latest] = await connection.query('SELECT * FROM accounts WHERE account_id = ?', [accountId]);
    throw httpError(409, 'Account version conflict', { account: latest[0] });
  }
  return true;
}
