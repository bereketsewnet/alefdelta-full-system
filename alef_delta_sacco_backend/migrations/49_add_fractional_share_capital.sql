SET @add_share_unit_balance = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE accounts ADD COLUMN share_unit_balance DECIMAL(28,8) NOT NULL DEFAULT 0 AFTER balance',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'share_unit_balance'
);
PREPARE stmt FROM @add_share_unit_balance;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_transaction_category = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE transactions ADD COLUMN transaction_category ENUM(''STANDARD_DEPOSIT'',''STANDARD_WITHDRAWAL'',''SHARE_PURCHASE'',''SHARE_REDEMPTION'') NULL AFTER txn_type',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'transaction_category'
);
PREPARE stmt FROM @add_transaction_category;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE transactions
SET transaction_category = CASE
  WHEN txn_type = 'DEPOSIT' THEN 'STANDARD_DEPOSIT'
  ELSE 'STANDARD_WITHDRAWAL'
END
WHERE transaction_category IS NULL;

ALTER TABLE transactions
  MODIFY COLUMN transaction_category ENUM(
    'STANDARD_DEPOSIT',
    'STANDARD_WITHDRAWAL',
    'SHARE_PURCHASE',
    'SHARE_REDEMPTION'
  ) NOT NULL DEFAULT 'STANDARD_DEPOSIT';

SET @add_deposit_request_type = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE deposit_requests ADD COLUMN request_type ENUM(''SAVINGS_DEPOSIT'',''SHARE_PURCHASE'') NOT NULL DEFAULT ''SAVINGS_DEPOSIT'' AFTER account_id',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deposit_requests' AND COLUMN_NAME = 'request_type'
);
PREPARE stmt FROM @add_deposit_request_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_quoted_share_price = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE deposit_requests ADD COLUMN quoted_share_price DECIMAL(18,2) NULL AFTER amount',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deposit_requests' AND COLUMN_NAME = 'quoted_share_price'
);
PREPARE stmt FROM @add_quoted_share_price;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_quoted_share_units = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE deposit_requests ADD COLUMN quoted_share_units DECIMAL(28,8) NULL AFTER quoted_share_price',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deposit_requests' AND COLUMN_NAME = 'quoted_share_units'
);
PREPARE stmt FROM @add_quoted_share_units;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_posted_transaction_id = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE deposit_requests ADD COLUMN posted_transaction_id CHAR(36) NULL AFTER approved_at',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deposit_requests' AND COLUMN_NAME = 'posted_transaction_id'
);
PREPARE stmt FROM @add_posted_transaction_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_deposit_request_type_index = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE deposit_requests ADD INDEX idx_deposit_requests_type_status (request_type, status, created_at)',
    'SELECT 1')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deposit_requests' AND INDEX_NAME = 'idx_deposit_requests_type_status'
);
PREPARE stmt FROM @add_deposit_request_type_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_deposit_request_transaction_fk = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE deposit_requests ADD CONSTRAINT fk_deposit_request_posted_transaction FOREIGN KEY (posted_transaction_id) REFERENCES transactions(txn_id)',
    'SELECT 1')
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'deposit_requests'
    AND CONSTRAINT_NAME = 'fk_deposit_request_posted_transaction'
);
PREPARE stmt FROM @add_deposit_request_transaction_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS share_unit_entries (
  share_entry_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NOT NULL,
  account_id CHAR(36) NOT NULL,
  transaction_id CHAR(36) NOT NULL,
  member_request_id CHAR(36) NULL,
  entry_type ENUM('PURCHASE','REDEMPTION') NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  share_price DECIMAL(18,2) NOT NULL,
  unit_delta DECIMAL(28,8) NOT NULL,
  units_after DECIMAL(28,8) NOT NULL,
  balance_after DECIMAL(18,2) NOT NULL,
  performed_by CHAR(36) NULL,
  idempotency_key VARCHAR(150) NOT NULL,
  effective_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_share_entry_transaction (transaction_id),
  UNIQUE KEY uq_share_entry_idempotency (idempotency_key),
  KEY idx_share_entries_member_date (member_id, effective_at),
  KEY idx_share_entries_account_date (account_id, effective_at),
  CONSTRAINT fk_share_entry_member FOREIGN KEY (member_id) REFERENCES members(member_id),
  CONSTRAINT fk_share_entry_account FOREIGN KEY (account_id) REFERENCES accounts(account_id),
  CONSTRAINT fk_share_entry_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(txn_id),
  CONSTRAINT fk_share_entry_request FOREIGN KEY (member_request_id) REFERENCES deposit_requests(request_id),
  CONSTRAINT fk_share_entry_performer FOREIGN KEY (performed_by) REFERENCES users(user_id),
  CHECK (amount > 0),
  CHECK (share_price > 0),
  CHECK (unit_delta <> 0),
  CHECK (units_after >= 0),
  CHECK (balance_after >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS share_purchase_lots (
  lot_id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  purchase_entry_id CHAR(36) NOT NULL,
  original_amount DECIMAL(18,2) NOT NULL,
  original_units DECIMAL(28,8) NOT NULL,
  purchase_price DECIMAL(18,2) NOT NULL,
  acquired_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_share_purchase_lot_entry (purchase_entry_id),
  KEY idx_share_purchase_lots_fifo (account_id, acquired_at, lot_id),
  CONSTRAINT fk_share_lot_account FOREIGN KEY (account_id) REFERENCES accounts(account_id),
  CONSTRAINT fk_share_lot_entry FOREIGN KEY (purchase_entry_id) REFERENCES share_unit_entries(share_entry_id),
  CHECK (original_amount > 0),
  CHECK (original_units > 0),
  CHECK (purchase_price > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS share_redemption_allocations (
  allocation_id CHAR(36) PRIMARY KEY,
  redemption_entry_id CHAR(36) NOT NULL,
  lot_id CHAR(36) NOT NULL,
  amount_redeemed DECIMAL(18,2) NOT NULL,
  units_redeemed DECIMAL(28,8) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_share_redemption_lot (redemption_entry_id, lot_id),
  KEY idx_share_redemption_allocations_lot (lot_id),
  CONSTRAINT fk_share_redemption_entry FOREIGN KEY (redemption_entry_id) REFERENCES share_unit_entries(share_entry_id),
  CONSTRAINT fk_share_redemption_lot FOREIGN KEY (lot_id) REFERENCES share_purchase_lots(lot_id),
  CHECK (amount_redeemed > 0),
  CHECK (units_redeemed > 0)
) ENGINE=InnoDB;

ALTER TABLE profit_distributions
  MODIFY COLUMN total_share_units DECIMAL(28,8) NOT NULL;

ALTER TABLE profit_distribution_member_allocations
  MODIFY COLUMN calculated_share_units DECIMAL(28,8) NOT NULL DEFAULT 0,
  MODIFY COLUMN override_share_units DECIMAL(28,8) NULL;

-- Production may have removed the historical SHR_CAP seed while cleaning demo
-- products. Recreate only this canonical product when it is genuinely absent;
-- existing product names/descriptions are preserved.
INSERT IGNORE INTO account_products (
  product_code,
  name,
  description,
  category,
  financial_category,
  product_kind,
  is_active,
  min_balance,
  min_deposit,
  interest_rate,
  interest_method
) VALUES (
  'SHR_CAP',
  'Share Capital',
  'Member equity account for fractional SACCO share ownership',
  'SHARES',
  'SHARE_CAPITAL',
  'STANDARD',
  1,
  0,
  0,
  0,
  'PROFIT_SHARING'
);

UPDATE account_products
SET financial_category = 'SHARE_CAPITAL', interest_method = 'PROFIT_SHARING', interest_rate = 0, is_active = 1
WHERE product_code = 'SHR_CAP';

UPDATE accounts
SET interest_method = 'PROFIT_SHARING'
WHERE product_code = 'SHR_CAP';

UPDATE system_config
SET description = CASE config_key
  WHEN 'share_price' THEN 'Price in ETB used only for future Share Capital purchases; existing units never change'
  WHEN 'min_shares_required' THEN 'Informational minimum Share Capital ownership target; never treated as a lien or transaction blocker'
  ELSE description
END
WHERE config_key IN ('share_price','min_shares_required');

DROP TRIGGER IF EXISTS trg_share_unit_entries_no_update;
CREATE TRIGGER trg_share_unit_entries_no_update
BEFORE UPDATE ON share_unit_entries
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Share unit entries are append-only and cannot be updated';

DROP TRIGGER IF EXISTS trg_share_unit_entries_no_delete;
CREATE TRIGGER trg_share_unit_entries_no_delete
BEFORE DELETE ON share_unit_entries
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Share unit entries are append-only and cannot be deleted';

DROP TRIGGER IF EXISTS trg_share_purchase_lots_no_update;
CREATE TRIGGER trg_share_purchase_lots_no_update
BEFORE UPDATE ON share_purchase_lots
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Share purchase lots are immutable and cannot be updated';

DROP TRIGGER IF EXISTS trg_share_purchase_lots_no_delete;
CREATE TRIGGER trg_share_purchase_lots_no_delete
BEFORE DELETE ON share_purchase_lots
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Share purchase lots are immutable and cannot be deleted';

DROP TRIGGER IF EXISTS trg_share_redemption_allocations_no_update;
CREATE TRIGGER trg_share_redemption_allocations_no_update
BEFORE UPDATE ON share_redemption_allocations
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Share redemption allocations are immutable and cannot be updated';

DROP TRIGGER IF EXISTS trg_share_redemption_allocations_no_delete;
CREATE TRIGGER trg_share_redemption_allocations_no_delete
BEFORE DELETE ON share_redemption_allocations
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Share redemption allocations are immutable and cannot be deleted';
