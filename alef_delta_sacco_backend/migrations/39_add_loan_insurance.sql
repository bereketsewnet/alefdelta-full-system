ALTER TABLE loan_applications
  ADD COLUMN borrower_age INT NULL AFTER service_charge_amount,
  ADD COLUMN insurance_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER borrower_age,
  ADD COLUMN insurance_ceiling_rate DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER insurance_enabled,
  ADD COLUMN insurance_rate DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER insurance_ceiling_rate,
  ADD COLUMN insurance_premium DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER insurance_rate,
  ADD COLUMN insurance_renewal_date DATE NULL AFTER insurance_premium;

INSERT INTO system_config (config_key, config_value, description) VALUES
('loan_insurance_enabled','true','Enable mandatory loan life insurance calculation'),
('loan_insurance_discount_pct','0','Optional reduction from the insurance ceiling rate; must be 0 or greater and can never increase the matrix rate')
ON DUPLICATE KEY UPDATE description = VALUES(description);
