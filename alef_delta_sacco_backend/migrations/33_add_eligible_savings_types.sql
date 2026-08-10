ALTER TABLE loan_products
  ADD COLUMN eligible_savings_types VARCHAR(255) DEFAULT NULL
  COMMENT 'Comma-separated list of savings account product codes that count toward pre-savings check. NULL means all SAV accounts.';

UPDATE loan_products SET eligible_savings_types = 'SAV_COMPULSORY,SAV_VOLUNTARY' WHERE product_code LIKE 'TIER-%';
