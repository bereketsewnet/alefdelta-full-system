-- Expand account_products with directive-specific fields
ALTER TABLE account_products
  ADD COLUMN product_kind ENUM('STANDARD','CHILDREN','IN_KIND','MICRO') NOT NULL DEFAULT 'STANDARD' AFTER category,
  ADD COLUMN guardian_required TINYINT(1) NOT NULL DEFAULT 0 AFTER product_kind,
  ADD COLUMN commodity_required TINYINT(1) NOT NULL DEFAULT 0 AFTER guardian_required,
  ADD COLUMN target_required TINYINT(1) NOT NULL DEFAULT 0 AFTER commodity_required,
  ADD COLUMN default_commodity_type VARCHAR(120) NULL AFTER target_required,
  ADD COLUMN min_deposit DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER min_balance,
  ADD COLUMN withdrawal_policy TEXT NULL AFTER interest_rate,
  ADD COLUMN metadata_schema TEXT NULL AFTER withdrawal_policy,
  ADD COLUMN notes TEXT NULL AFTER metadata_schema;

-- Allow accounts to capture structured metadata (guardian info, commodity details, etc.)
ALTER TABLE accounts
  ADD COLUMN metadata JSON NULL AFTER currency;
-- Extend account_products with directive-aligned fields
ALTER TABLE account_products
  ADD COLUMN product_type ENUM('STANDARD','CHILD','IN_KIND','MICRO') NOT NULL DEFAULT 'STANDARD' AFTER name,
  ADD COLUMN requires_guardian TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN accepts_in_kind TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN in_kind_units VARCHAR(50) NULL,
  ADD COLUMN auto_convert_in_kind TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN min_monthly_deposit DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN withdrawal_notice_days INT NOT NULL DEFAULT 0,
  ADD COLUMN metadata JSON NULL AFTER withdrawal_notice_days;

-- Update existing seed data with defaults
UPDATE account_products
SET product_type = 'STANDARD',
    requires_guardian = 0,
    accepts_in_kind = 0,
    auto_convert_in_kind = 1,
    min_monthly_deposit = CASE product_code
      WHEN 'SAV_COMPULSORY' THEN 1500
      ELSE 0
    END,
    withdrawal_notice_days = CASE product_code
      WHEN 'SAV_FIXED' THEN 30
      ELSE 0
    END
WHERE product_type IS NULL;

-- Seed template products for directive-specific categories
INSERT INTO account_products (
  product_code,
  name,
  description,
  category,
  product_type,
  requires_guardian,
  accepts_in_kind,
  in_kind_units,
  auto_convert_in_kind,
  min_balance,
  min_monthly_deposit,
  withdrawal_notice_days,
  interest_rate,
  metadata
) VALUES
('SAV_CHILD', 'Children''s Savings', 'Guardian-managed savings for minors', 'FAMILY', 'CHILD', 1, 0, NULL, 1, 0, 100, 0, 0, JSON_OBJECT('notes', 'Guardian approval required for withdrawals')),
('SAV_IN_KIND', 'In-Kind Savings', 'Commodity-based savings converted on demand', 'IN_KIND', 'IN_KIND', 0, 1, 'kg or units', 0, 0, 0, 0, 0, JSON_OBJECT('notes', 'Record commodity type and storage location')),
('SAV_MICRO', 'Micro Savings', 'Low-balance, high-frequency savings product', 'MICRO', 'MICRO', 0, 0, NULL, 1, 0, 50, 0, 0, JSON_OBJECT('notes', 'Ideal for daily micro-deposits'))
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  category = VALUES(category),
  product_type = VALUES(product_type),
  requires_guardian = VALUES(requires_guardian),
  accepts_in_kind = VALUES(accepts_in_kind),
  in_kind_units = VALUES(in_kind_units),
  auto_convert_in_kind = VALUES(auto_convert_in_kind),
  min_balance = VALUES(min_balance),
  min_monthly_deposit = VALUES(min_monthly_deposit),
  withdrawal_notice_days = VALUES(withdrawal_notice_days),
  interest_rate = VALUES(interest_rate),
  metadata = VALUES(metadata);

