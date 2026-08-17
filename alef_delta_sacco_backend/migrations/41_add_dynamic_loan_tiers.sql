ALTER TABLE account_products
  ADD COLUMN financial_category ENUM('COMPULSORY_SAVINGS','VOLUNTARY_SAVINGS','SHARE_CAPITAL','OTHER') NOT NULL DEFAULT 'OTHER' AFTER category;

UPDATE account_products SET financial_category = 'COMPULSORY_SAVINGS' WHERE product_code = 'SAV_COMPULSORY';
UPDATE account_products SET financial_category = 'VOLUNTARY_SAVINGS' WHERE product_code = 'SAV_VOLUNTARY';
UPDATE account_products SET financial_category = 'SHARE_CAPITAL' WHERE product_code = 'SHR_CAP';

ALTER TABLE loan_products
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER penalty_rate;

CREATE TABLE loan_product_tiers (
  tier_id CHAR(36) PRIMARY KEY,
  product_code VARCHAR(30) NOT NULL,
  tier_code VARCHAR(30) NOT NULL,
  name VARCHAR(150) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  min_savings_duration_months INT NOT NULL DEFAULT 0,
  loan_amount_min_etb DECIMAL(18,2) NOT NULL DEFAULT 0,
  loan_amount_max_etb DECIMAL(18,2) NULL,
  max_term_months INT NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  required_pre_savings_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  required_share_purchase_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_loan_product_tier_code (product_code, tier_code),
  KEY idx_loan_product_tiers_product (product_code, is_active, display_order),
  CONSTRAINT fk_loan_tier_product FOREIGN KEY (product_code) REFERENCES loan_products(product_code)
) ENGINE=InnoDB;

CREATE TABLE loan_tier_eligible_account_products (
  tier_id CHAR(36) NOT NULL,
  account_product_code VARCHAR(30) NOT NULL,
  PRIMARY KEY (tier_id, account_product_code),
  CONSTRAINT fk_tier_eligible_tier FOREIGN KEY (tier_id) REFERENCES loan_product_tiers(tier_id),
  CONSTRAINT fk_tier_eligible_account_product FOREIGN KEY (account_product_code) REFERENCES account_products(product_code)
) ENGINE=InnoDB;

ALTER TABLE loan_applications
  ADD COLUMN selected_tier_id CHAR(36) NULL AFTER product_code,
  ADD COLUMN tier_policy_snapshot JSON NULL AFTER eligibility_snapshot,
  ADD COLUMN eligibility_checked_at DATETIME NULL AFTER tier_policy_snapshot,
  ADD COLUMN eligibility_exception_required TINYINT(1) NOT NULL DEFAULT 0 AFTER eligibility_checked_at,
  ADD COLUMN officer_exception_reason TEXT NULL AFTER eligibility_exception_required,
  ADD COLUMN created_by_user_id CHAR(36) NULL AFTER officer_exception_reason,
  ADD KEY idx_loan_selected_tier (selected_tier_id),
  ADD CONSTRAINT fk_loan_selected_tier FOREIGN KEY (selected_tier_id) REFERENCES loan_product_tiers(tier_id),
  ADD CONSTRAINT fk_loan_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(user_id);

CREATE TABLE loan_eligibility_evaluations (
  evaluation_id CHAR(36) PRIMARY KEY,
  loan_id CHAR(36) NOT NULL,
  evaluation_source ENUM('SUBMISSION','MANUAL_REFRESH') NOT NULL,
  passed TINYINT(1) NOT NULL,
  result_snapshot JSON NOT NULL,
  evaluated_by_user_id CHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_loan_eligibility_loan (loan_id, created_at),
  CONSTRAINT fk_eligibility_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id),
  CONSTRAINT fk_eligibility_actor FOREIGN KEY (evaluated_by_user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

ALTER TABLE loan_applications
  ADD COLUMN latest_eligibility_evaluation_id CHAR(36) NULL AFTER eligibility_checked_at,
  ADD CONSTRAINT fk_loan_latest_eligibility FOREIGN KEY (latest_eligibility_evaluation_id) REFERENCES loan_eligibility_evaluations(evaluation_id);

ALTER TABLE loan_approval_votes
  ADD COLUMN eligibility_evaluation_id CHAR(36) NULL AFTER reason,
  ADD COLUMN override_acknowledged TINYINT(1) NOT NULL DEFAULT 0 AFTER eligibility_evaluation_id,
  ADD COLUMN override_reason TEXT NULL AFTER override_acknowledged,
  ADD CONSTRAINT fk_vote_eligibility_evaluation FOREIGN KEY (eligibility_evaluation_id) REFERENCES loan_eligibility_evaluations(evaluation_id);

INSERT INTO loan_product_tiers
  (tier_id, product_code, tier_code, name, display_order, min_savings_duration_months,
   loan_amount_min_etb, loan_amount_max_etb, max_term_months, interest_rate,
   required_pre_savings_pct, required_share_purchase_pct)
VALUES
  ('41000000-0000-4000-8000-000000000001','TIER-1','STD-01','Standard Tier 1',1,3,0,100000,24,14.00,10.00,10.00),
  ('41000000-0000-4000-8000-000000000002','TIER-1','STD-02','Standard Tier 2',2,4,100001,200000,48,15.50,10.00,10.00),
  ('41000000-0000-4000-8000-000000000003','TIER-1','STD-03','Standard Tier 3',3,5,200001,400000,48,15.50,10.00,10.00),
  ('41000000-0000-4000-8000-000000000004','TIER-1','STD-04','Standard Tier 4',4,6,400001,1000000,48,15.50,20.00,10.00),
  ('41000000-0000-4000-8000-000000000005','TIER-1','STD-05','Standard Tier 5',5,7,1000001,1500000,60,16.50,20.00,10.00),
  ('41000000-0000-4000-8000-000000000006','TIER-1','STD-06','Standard Tier 6',6,8,1500001,2500000,60,16.50,30.00,10.00),
  ('41000000-0000-4000-8000-000000000007','TIER-1','STD-07','Standard Tier 7',7,9,2500001,3500000,60,16.50,30.00,10.00),
  ('41000000-0000-4000-8000-000000000008','TIER-1','STD-08','Standard Tier 8',8,10,3500001,7000000,96,17.00,35.00,15.00),
  ('41000000-0000-4000-8000-000000000009','TIER-9','VEH-01','Vehicle Purchase Tier',1,3,0,3500000,60,16.50,50.00,10.00),
  ('41000000-0000-4000-8000-000000000010','TIER-10','HOU-01','House Purchase Tier',1,4,0,7000000,96,17.00,45.00,15.00);

INSERT INTO loan_tier_eligible_account_products (tier_id, account_product_code)
SELECT tier_id, 'SAV_COMPULSORY'
FROM loan_product_tiers
WHERE tier_id LIKE '41000000-0000-4000-8000-0000000000%';

UPDATE loan_products SET name = 'Standard Policy Loan', max_term_months = 96 WHERE product_code = 'TIER-1';
UPDATE loan_products SET is_active = 0 WHERE product_code IN ('TIER-2','TIER-3','TIER-4','TIER-5','TIER-6','TIER-7','TIER-8');

INSERT INTO loan_product_tiers
  (tier_id, product_code, tier_code, name, display_order, min_savings_duration_months,
   loan_amount_min_etb, loan_amount_max_etb, max_term_months, interest_rate,
   required_pre_savings_pct, required_share_purchase_pct)
SELECT UUID(), p.product_code, 'DEFAULT', CONCAT(p.name, ' Default Tier'), 1,
  COALESCE(p.min_savings_duration_months, 0), COALESCE(p.loan_amount_min_etb, 0), p.loan_amount_max_etb,
  p.max_term_months, p.interest_rate, COALESCE(p.required_pre_savings_pct, 0),
  COALESCE(p.required_share_purchase_pct, 0)
FROM loan_products p
WHERE p.product_code NOT IN ('TIER-1','TIER-2','TIER-3','TIER-4','TIER-5','TIER-6','TIER-7','TIER-8','TIER-9','TIER-10');

INSERT INTO loan_tier_eligible_account_products (tier_id, account_product_code)
SELECT t.tier_id, 'SAV_COMPULSORY'
FROM loan_product_tiers t
LEFT JOIN loan_tier_eligible_account_products e ON e.tier_id = t.tier_id
WHERE e.tier_id IS NULL;

UPDATE loan_applications l
SET selected_tier_id = (
  SELECT t.tier_id FROM loan_product_tiers t
  WHERE t.product_code = l.product_code AND t.is_active = 1
  ORDER BY t.display_order, t.loan_amount_min_etb LIMIT 1
)
WHERE l.selected_tier_id IS NULL;
