-- Create loan_repayment_requests table for member loan repayment requests
CREATE TABLE IF NOT EXISTS loan_repayment_requests (
  request_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NOT NULL,
  loan_id CHAR(36) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  payment_method ENUM('CASH','BANK_TRANSFER','MOBILE_MONEY','CHECK') DEFAULT 'CASH',
  receipt_number VARCHAR(100) NULL,
  receipt_photo_url VARCHAR(255) NULL,
  notes TEXT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_loan_repayment_request_member FOREIGN KEY (member_id) REFERENCES members(member_id),
  CONSTRAINT fk_loan_repayment_request_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id),
  CONSTRAINT fk_loan_repayment_request_approver FOREIGN KEY (approved_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Add index for faster queries
CREATE INDEX idx_loan_repayment_requests_member ON loan_repayment_requests(member_id);
CREATE INDEX idx_loan_repayment_requests_loan ON loan_repayment_requests(loan_id);
CREATE INDEX idx_loan_repayment_requests_status ON loan_repayment_requests(status);
CREATE INDEX idx_loan_repayment_requests_created ON loan_repayment_requests(created_at DESC);


