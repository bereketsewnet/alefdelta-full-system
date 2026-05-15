-- Create loan_requests table for public loan request applications
-- This is a request form, not an actual loan registration
CREATE TABLE IF NOT EXISTS loan_requests (
  request_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NULL, -- NULL if submitted before login
  phone VARCHAR(20) NULL, -- For tracking before member registration
  loan_purpose VARCHAR(100) NOT NULL, -- Selected purpose or 'OTHER'
  other_purpose TEXT NULL, -- Custom reason if 'OTHER' selected
  requested_amount DECIMAL(18,2) NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  notes TEXT NULL, -- Staff notes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_loan_request_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE SET NULL,
  CONSTRAINT fk_loan_request_approver FOREIGN KEY (approved_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Add indexes for faster queries
CREATE INDEX idx_loan_requests_member ON loan_requests(member_id);
CREATE INDEX idx_loan_requests_phone ON loan_requests(phone);
CREATE INDEX idx_loan_requests_status ON loan_requests(status);
CREATE INDEX idx_loan_requests_created ON loan_requests(created_at DESC);

