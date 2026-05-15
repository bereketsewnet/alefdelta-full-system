-- Create deposit_requests table for member deposit requests
CREATE TABLE IF NOT EXISTS deposit_requests (
  request_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NOT NULL,
  account_id CHAR(36) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  reference_number VARCHAR(100) NULL,
  receipt_photo_url VARCHAR(255) NULL,
  description TEXT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_deposit_request_member FOREIGN KEY (member_id) REFERENCES members(member_id),
  CONSTRAINT fk_deposit_request_account FOREIGN KEY (account_id) REFERENCES accounts(account_id),
  CONSTRAINT fk_deposit_request_approver FOREIGN KEY (approved_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Add index for faster queries
CREATE INDEX idx_deposit_requests_member ON deposit_requests(member_id);
CREATE INDEX idx_deposit_requests_status ON deposit_requests(status);
CREATE INDEX idx_deposit_requests_created ON deposit_requests(created_at DESC);

