UPDATE account_products
SET interest_method = 'PROFIT_SHARING', interest_rate = 0
WHERE product_code = 'SAV_COMPULSORY';

UPDATE accounts
SET interest_method = 'PROFIT_SHARING'
WHERE product_code = 'SAV_COMPULSORY';

INSERT INTO system_config (config_key, config_value, description)
VALUES ('registration_fee_etb', '1000', 'Registration fee recognized as SACCO revenue on first member activation')
ON DUPLICATE KEY UPDATE description = VALUES(description);

CREATE TABLE sacco_master_account (
  account_key VARCHAR(30) PRIMARY KEY,
  currency VARCHAR(8) NOT NULL DEFAULT 'ETB',
  balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (balance >= 0)
) ENGINE=InnoDB;

INSERT INTO sacco_master_account (account_key, currency, balance)
VALUES ('ETB_MASTER', 'ETB', 0);

CREATE TABLE profit_distribution_policies (
  policy_id CHAR(36) PRIMARY KEY,
  policy_version INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  reserve_bps INT NOT NULL,
  board_quorum_count INT NOT NULL DEFAULT 2,
  payout_product_code VARCHAR(30) NOT NULL,
  status ENUM('ACTIVE','RETIRED') NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  retired_at DATETIME NULL,
  UNIQUE KEY uq_profit_policy_version (policy_version),
  KEY idx_profit_policy_status (status, policy_version),
  CONSTRAINT fk_profit_policy_product FOREIGN KEY (payout_product_code) REFERENCES account_products(product_code),
  CONSTRAINT fk_profit_policy_creator FOREIGN KEY (created_by) REFERENCES users(user_id),
  CHECK (reserve_bps >= 0 AND reserve_bps <= 10000),
  CHECK (board_quorum_count > 0)
) ENGINE=InnoDB;

CREATE TABLE profit_distribution_buckets (
  bucket_id CHAR(36) PRIMARY KEY,
  policy_id CHAR(36) NOT NULL,
  bucket_code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  percentage_bps INT NOT NULL,
  allocation_basis ENUM('SHARE_UNITS','SAVINGS_BALANCE','INTERNAL') NOT NULL,
  is_member_payable TINYINT(1) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_profit_bucket_code (policy_id, bucket_code),
  KEY idx_profit_bucket_policy (policy_id, display_order),
  CONSTRAINT fk_profit_bucket_policy FOREIGN KEY (policy_id) REFERENCES profit_distribution_policies(policy_id),
  CHECK (percentage_bps >= 0 AND percentage_bps <= 10000)
) ENGINE=InnoDB;

CREATE TABLE profit_bucket_eligible_products (
  bucket_id CHAR(36) NOT NULL,
  product_code VARCHAR(30) NOT NULL,
  PRIMARY KEY (bucket_id, product_code),
  CONSTRAINT fk_profit_eligible_bucket FOREIGN KEY (bucket_id) REFERENCES profit_distribution_buckets(bucket_id),
  CONSTRAINT fk_profit_eligible_product FOREIGN KEY (product_code) REFERENCES account_products(product_code)
) ENGINE=InnoDB;

CREATE TABLE profit_distributions (
  distribution_id CHAR(36) PRIMARY KEY,
  policy_id CHAR(36) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  ledger_cutoff_at DATETIME NOT NULL,
  status ENUM('DRAFT','PENDING_BOARD','READY_FOR_PAYOUT','PAID','REJECTED','VOID') NOT NULL DEFAULT 'DRAFT',
  total_inflows DECIMAL(18,2) NOT NULL,
  total_outflows DECIMAL(18,2) NOT NULL,
  net_profit DECIMAL(18,2) NOT NULL,
  reserve_amount DECIMAL(18,2) NOT NULL,
  member_payout_amount DECIMAL(18,2) NOT NULL,
  retained_allocation_amount DECIMAL(18,2) NOT NULL,
  share_price DECIMAL(18,2) NOT NULL,
  total_share_units BIGINT UNSIGNED NOT NULL,
  total_eligible_savings DECIMAL(18,2) NOT NULL,
  policy_snapshot JSON NOT NULL,
  generated_by CHAR(36) NOT NULL,
  submitted_by CHAR(36) NULL,
  submitted_at DATETIME NULL,
  paid_by CHAR(36) NULL,
  paid_at DATETIME NULL,
  payout_ledger_id CHAR(36) NULL,
  voided_by CHAR(36) NULL,
  void_reason TEXT NULL,
  voided_at DATETIME NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_profit_distribution_period (period_start, period_end, status),
  KEY idx_profit_distribution_status (status, created_at),
  CONSTRAINT fk_profit_distribution_policy FOREIGN KEY (policy_id) REFERENCES profit_distribution_policies(policy_id),
  CONSTRAINT fk_profit_distribution_generator FOREIGN KEY (generated_by) REFERENCES users(user_id),
  CONSTRAINT fk_profit_distribution_submitter FOREIGN KEY (submitted_by) REFERENCES users(user_id),
  CONSTRAINT fk_profit_distribution_payer FOREIGN KEY (paid_by) REFERENCES users(user_id),
  CONSTRAINT fk_profit_distribution_voider FOREIGN KEY (voided_by) REFERENCES users(user_id),
  CHECK (period_end >= period_start),
  CHECK (net_profit > 0)
) ENGINE=InnoDB;

CREATE TABLE sacco_master_ledger (
  ledger_id CHAR(36) PRIMARY KEY,
  account_key VARCHAR(30) NOT NULL DEFAULT 'ETB_MASTER',
  entry_date DATE NOT NULL,
  posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  direction ENUM('INFLOW','OUTFLOW') NOT NULL,
  entry_type ENUM('REGISTRATION_FEE','LOAN_INTEREST','LOAN_PENALTY','SAVINGS_INTEREST','MANUAL_REVENUE','MANUAL_EXPENSE','OPENING_ADJUSTMENT','DIVIDEND_PAYOUT','REVERSAL') NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  balance_after DECIMAL(18,2) NOT NULL,
  affects_profit TINYINT(1) NOT NULL DEFAULT 1,
  source_type VARCHAR(60) NULL,
  source_id VARCHAR(100) NULL,
  source_component VARCHAR(60) NULL,
  distribution_id CHAR(36) NULL,
  performed_by CHAR(36) NULL,
  description TEXT NULL,
  idempotency_key VARCHAR(150) NULL,
  reversal_of CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_master_source_component (source_type, source_id, source_component),
  UNIQUE KEY uq_master_idempotency (idempotency_key),
  KEY idx_master_ledger_date (entry_date, posted_at),
  KEY idx_master_ledger_type (entry_type, direction),
  CONSTRAINT fk_master_ledger_account FOREIGN KEY (account_key) REFERENCES sacco_master_account(account_key),
  CONSTRAINT fk_master_ledger_distribution FOREIGN KEY (distribution_id) REFERENCES profit_distributions(distribution_id),
  CONSTRAINT fk_master_ledger_user FOREIGN KEY (performed_by) REFERENCES users(user_id),
  CONSTRAINT fk_master_ledger_reversal FOREIGN KEY (reversal_of) REFERENCES sacco_master_ledger(ledger_id),
  CHECK (amount > 0),
  CHECK (balance_after >= 0)
) ENGINE=InnoDB;

ALTER TABLE profit_distributions
  ADD CONSTRAINT fk_profit_distribution_payout_ledger FOREIGN KEY (payout_ledger_id) REFERENCES sacco_master_ledger(ledger_id);

CREATE TABLE profit_distribution_allocations (
  allocation_id CHAR(36) PRIMARY KEY,
  distribution_id CHAR(36) NOT NULL,
  bucket_code VARCHAR(50) NOT NULL,
  bucket_name VARCHAR(150) NOT NULL,
  percentage_bps INT NOT NULL,
  allocation_basis ENUM('SHARE_UNITS','SAVINGS_BALANCE','INTERNAL') NOT NULL,
  is_member_payable TINYINT(1) NOT NULL,
  allocated_amount DECIMAL(18,2) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_distribution_bucket (distribution_id, bucket_code),
  CONSTRAINT fk_distribution_allocation FOREIGN KEY (distribution_id) REFERENCES profit_distributions(distribution_id),
  CHECK (allocated_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE profit_distribution_member_allocations (
  member_allocation_id CHAR(36) PRIMARY KEY,
  distribution_id CHAR(36) NOT NULL,
  member_id CHAR(36) NOT NULL,
  share_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  calculated_share_units BIGINT UNSIGNED NOT NULL DEFAULT 0,
  override_share_units BIGINT UNSIGNED NULL,
  share_override_reason TEXT NULL,
  share_overridden_by CHAR(36) NULL,
  share_overridden_at DATETIME NULL,
  eligible_savings_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  share_dividend_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  savings_dividend_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_payout_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  payout_account_id CHAR(36) NULL,
  payout_transaction_id CHAR(36) NULL,
  payout_status ENUM('PENDING','PAID') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_distribution_member (distribution_id, member_id),
  KEY idx_member_profit_allocations (member_id, distribution_id),
  CONSTRAINT fk_member_allocation_distribution FOREIGN KEY (distribution_id) REFERENCES profit_distributions(distribution_id),
  CONSTRAINT fk_member_allocation_member FOREIGN KEY (member_id) REFERENCES members(member_id),
  CONSTRAINT fk_member_allocation_override_user FOREIGN KEY (share_overridden_by) REFERENCES users(user_id),
  CONSTRAINT fk_member_allocation_account FOREIGN KEY (payout_account_id) REFERENCES accounts(account_id),
  CONSTRAINT fk_member_allocation_transaction FOREIGN KEY (payout_transaction_id) REFERENCES transactions(txn_id),
  CHECK (share_balance >= 0),
  CHECK (eligible_savings_balance >= 0),
  CHECK (share_dividend_amount >= 0),
  CHECK (savings_dividend_amount >= 0),
  CHECK (total_payout_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE profit_distribution_board_votes (
  vote_id CHAR(36) PRIMARY KEY,
  distribution_id CHAR(36) NOT NULL,
  voter_id CHAR(36) NOT NULL,
  decision ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  reason TEXT NULL,
  decided_at DATETIME NULL,
  rejection_resolved TINYINT(1) NOT NULL DEFAULT 0,
  resolved_by CHAR(36) NULL,
  resolution_reason TEXT NULL,
  resolved_at DATETIME NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_profit_distribution_voter (distribution_id, voter_id),
  CONSTRAINT fk_profit_vote_distribution FOREIGN KEY (distribution_id) REFERENCES profit_distributions(distribution_id),
  CONSTRAINT fk_profit_vote_voter FOREIGN KEY (voter_id) REFERENCES users(user_id),
  CONSTRAINT fk_profit_vote_resolver FOREIGN KEY (resolved_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

INSERT INTO profit_distribution_policies
  (policy_id, policy_version, name, reserve_bps, board_quorum_count, payout_product_code, status)
VALUES
  ('42000000-0000-4000-8000-000000000001', 1, 'Alef Delta Statutory Profit Distribution', 3000, 2, 'SAV_COMPULSORY', 'ACTIVE');

INSERT INTO profit_distribution_buckets
  (bucket_id, policy_id, bucket_code, name, percentage_bps, allocation_basis, is_member_payable, display_order)
VALUES
  ('42000000-0000-4000-8000-000000000011','42000000-0000-4000-8000-000000000001','MEMBER_SHARE_DIVIDEND','Share Capital Fund',4900,'SHARE_UNITS',1,1),
  ('42000000-0000-4000-8000-000000000012','42000000-0000-4000-8000-000000000001','MEMBER_SAVINGS_DIVIDEND','Members Regular Savings Fund',800,'SAVINGS_BALANCE',1,2),
  ('42000000-0000-4000-8000-000000000013','42000000-0000-4000-8000-000000000001','EDUCATION_TRAINING','Education and Training',400,'INTERNAL',0,3),
  ('42000000-0000-4000-8000-000000000014','42000000-0000-4000-8000-000000000001','ENVIRONMENTAL_DEVELOPMENT','Environmental Development and Protection Fund (የአካባቢ ልማትና ጥበቃ)',100,'INTERNAL',0,4),
  ('42000000-0000-4000-8000-000000000015','42000000-0000-4000-8000-000000000001','EMPLOYEE_INCENTIVE','Employee Incentive Fund (የሠራተኞች ማበረታቻ)',200,'INTERNAL',0,5),
  ('42000000-0000-4000-8000-000000000016','42000000-0000-4000-8000-000000000001','BOARD_COMMITTEE_INCENTIVE','Board and Committee Incentive Fund (የቦርድና ኮሚቴ ማበረታቻ)',200,'INTERNAL',0,6),
  ('42000000-0000-4000-8000-000000000017','42000000-0000-4000-8000-000000000001','LOAN_LOSS_RESERVE','Loan Loss Reserve (የማይመለስ ብድር መጠባበቂያ)',400,'INTERNAL',0,7);

INSERT INTO profit_bucket_eligible_products (bucket_id, product_code)
VALUES ('42000000-0000-4000-8000-000000000012', 'SAV_COMPULSORY');
