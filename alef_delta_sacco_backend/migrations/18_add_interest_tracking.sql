-- Add interest calculation tracking to accounts

ALTER TABLE accounts
ADD COLUMN last_interest_date DATE NULL AFTER updated_at,
ADD COLUMN interest_earned_ytd DECIMAL(18,2) DEFAULT 0 AFTER last_interest_date,
ADD COLUMN month_opening_balance DECIMAL(18,2) NULL AFTER interest_earned_ytd,
ADD COLUMN month_minimum_balance DECIMAL(18,2) NULL AFTER month_opening_balance;

-- Add comment
ALTER TABLE accounts
MODIFY COLUMN last_interest_date DATE NULL COMMENT 'Last date interest was calculated and applied',
MODIFY COLUMN interest_earned_ytd DECIMAL(18,2) DEFAULT 0 COMMENT 'Year-to-date interest earned',
MODIFY COLUMN month_opening_balance DECIMAL(18,2) NULL COMMENT 'Balance at start of current month (for deposit interest)',
MODIFY COLUMN month_minimum_balance DECIMAL(18,2) NULL COMMENT 'Minimum balance during month (for withdrawal interest)';

-- Create interest transaction records table
CREATE TABLE IF NOT EXISTS interest_postings (
  posting_id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  member_id CHAR(36) NOT NULL,
  posting_date DATE NOT NULL,
  interest_amount DECIMAL(18,2) NOT NULL,
  calculation_method ENUM('OPENING_BALANCE','MINIMUM_BALANCE') NOT NULL,
  balance_used DECIMAL(18,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  days_in_month INT NOT NULL DEFAULT 30,
  balance_before DECIMAL(18,2) NOT NULL,
  balance_after DECIMAL(18,2) NOT NULL,
  posting_month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM format',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_interest_account FOREIGN KEY (account_id) REFERENCES accounts(account_id),
  CONSTRAINT fk_interest_member FOREIGN KEY (member_id) REFERENCES members(member_id),
  UNIQUE KEY unique_account_month (account_id, posting_month)
) ENGINE=InnoDB;

-- Add index for performance
CREATE INDEX idx_interest_date ON interest_postings(posting_date);
CREATE INDEX idx_interest_month ON interest_postings(posting_month);


