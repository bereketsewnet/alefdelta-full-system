ALTER TABLE loan_products
  ADD COLUMN penalty_mode ENUM('PERCENT','FIXED') NOT NULL DEFAULT 'PERCENT' AFTER penalty_rate,
  ADD COLUMN penalty_fixed_amount DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER penalty_mode,
  ADD COLUMN penalty_grace_days INT NOT NULL DEFAULT 0 AFTER penalty_fixed_amount,
  ADD COLUMN penalty_escalation_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER penalty_grace_days,
  ADD COLUMN penalty_escalation_value DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER penalty_escalation_enabled;

ALTER TABLE loan_applications
  ADD COLUMN penalty_mode ENUM('PERCENT','FIXED') NOT NULL DEFAULT 'PERCENT' AFTER interest_type,
  ADD COLUMN penalty_fixed_amount DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER penalty_mode,
  ADD COLUMN penalty_grace_days INT NOT NULL DEFAULT 0 AFTER penalty_fixed_amount,
  ADD COLUMN penalty_escalation_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER penalty_grace_days,
  ADD COLUMN penalty_escalation_value DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER penalty_escalation_enabled,
  ADD COLUMN penalty_due DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER total_penalty;

CREATE TABLE loan_penalty_adjustments (
  adjustment_id CHAR(36) PRIMARY KEY,
  loan_id CHAR(36) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  reason TEXT NOT NULL,
  adjusted_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_penalty_adjustment_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id),
  CONSTRAINT fk_penalty_adjustment_user FOREIGN KEY (adjusted_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

UPDATE loan_products SET penalty_rate = 2.00 WHERE penalty_rate IS NULL OR penalty_rate = 0;
