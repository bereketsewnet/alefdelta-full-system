ALTER TABLE loan_applications ADD COLUMN penalty_rate DECIMAL(5,2) NOT NULL DEFAULT 2.00 AFTER interest_type;
