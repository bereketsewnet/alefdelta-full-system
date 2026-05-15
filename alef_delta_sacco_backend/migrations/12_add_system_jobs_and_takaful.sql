-- Table to track system jobs (EOD, EOM, etc.)
CREATE TABLE IF NOT EXISTS system_jobs (
  job_id VARCHAR(36) PRIMARY KEY,
  job_type ENUM('EOD', 'EOM') NOT NULL,
  status ENUM('RUNNING', 'COMPLETED', 'FAILED') NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  performed_by VARCHAR(36) NULL,
  summary JSON NULL,
  error_message TEXT NULL,
  INDEX idx_job_type_created (job_type, started_at)
);

-- Add non-interest/takaful columns to account_products
ALTER TABLE account_products
ADD COLUMN interest_method ENUM('STANDARD', 'NON_INTEREST', 'PROFIT_SHARING') DEFAULT 'STANDARD' AFTER interest_rate,
ADD COLUMN profit_share_ratio DECIMAL(5,2) DEFAULT 0.00 AFTER interest_method;

-- Add non-interest/takaful columns to accounts
ALTER TABLE accounts
ADD COLUMN interest_method ENUM('STANDARD', 'NON_INTEREST', 'PROFIT_SHARING') DEFAULT 'STANDARD' AFTER currency;

