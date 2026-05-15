-- Create partner_requests table for partnership and sponsorship requests
CREATE TABLE IF NOT EXISTS partner_requests (
  request_id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NULL,
  phone VARCHAR(20) NOT NULL,
  request_type ENUM('PARTNERSHIP','SPONSORSHIP') NOT NULL,
  sponsorship_type ENUM('PLATINUM','GOLD','SILVER') NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_partner_request_approver FOREIGN KEY (approved_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Add indexes for faster queries
CREATE INDEX idx_partner_requests_status ON partner_requests(status);
CREATE INDEX idx_partner_requests_type ON partner_requests(request_type);
CREATE INDEX idx_partner_requests_created ON partner_requests(created_at DESC);



