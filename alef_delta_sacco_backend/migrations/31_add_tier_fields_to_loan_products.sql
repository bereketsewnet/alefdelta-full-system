ALTER TABLE loan_products
  ADD COLUMN min_savings_duration_months INT NULL,
  ADD COLUMN loan_amount_min_etb DECIMAL(18,2) NULL,
  ADD COLUMN loan_amount_max_etb DECIMAL(18,2) NULL,
  ADD COLUMN required_pre_savings_pct DECIMAL(5,2) NULL,
  ADD COLUMN required_share_purchase_pct DECIMAL(5,2) NULL,
  ADD COLUMN requires_lump_sum_pre_savings BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN loan_category VARCHAR(20) NULL;
