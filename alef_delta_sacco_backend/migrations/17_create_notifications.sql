-- Migration: Create notifications table
-- This table stores notifications for members about various events

CREATE TABLE IF NOT EXISTS notifications (
  notification_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NOT NULL,
  type ENUM(
    'DEPOSIT',
    'WITHDRAWAL',
    'LOAN_APPROVED',
    'LOAN_REJECTED',
    'LOAN_DISBURSED',
    'LOAN_REPAYMENT',
    'LOAN_REPAYMENT_APPROVED',
    'LOAN_REPAYMENT_REJECTED',
    'DEPOSIT_REQUEST_APPROVED',
    'DEPOSIT_REQUEST_REJECTED',
    'PENALTY_APPLIED',
    'INTEREST_CREDITED',
    'ACCOUNT_FROZEN',
    'ACCOUNT_UNFROZEN',
    'PROFILE_UPDATE',
    'SYSTEM'
  ) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  metadata JSON NULL,
  is_read TINYINT(1) DEFAULT 0,
  read_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_member_id (member_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type),
  CONSTRAINT fk_notification_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

