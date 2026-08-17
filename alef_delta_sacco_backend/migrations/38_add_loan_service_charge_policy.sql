ALTER TABLE loan_products
  ADD COLUMN service_charge_mode ENUM('PERCENT','FIXED') NOT NULL DEFAULT 'PERCENT' AFTER penalty_escalation_value,
  ADD COLUMN service_charge_rate DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER service_charge_mode,
  ADD COLUMN service_charge_fixed_amount DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER service_charge_rate;

ALTER TABLE loan_applications
  ADD COLUMN service_charge_mode ENUM('PERCENT','FIXED') NOT NULL DEFAULT 'PERCENT' AFTER penalty_escalation_value,
  ADD COLUMN service_charge_rate DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER service_charge_mode,
  ADD COLUMN service_charge_fixed_amount DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER service_charge_rate,
  ADD COLUMN service_charge_amount DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER service_charge_fixed_amount;
