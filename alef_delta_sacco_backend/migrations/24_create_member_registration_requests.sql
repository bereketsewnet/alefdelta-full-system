-- Migration: Create member_registration_requests table for self-registration with approval workflow
-- Date: 2025-12-16

CREATE TABLE IF NOT EXISTS member_registration_requests (
  request_id CHAR(36) PRIMARY KEY,
  -- Basic member information (stored as JSON for flexibility)
  member_data JSON NOT NULL,
  -- Status and approval tracking
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Foreign keys
  CONSTRAINT fk_registration_request_approver FOREIGN KEY (approved_by) REFERENCES users(user_id),
  -- Indexes
  INDEX idx_registration_requests_status (status),
  INDEX idx_registration_requests_created (created_at DESC)
) ENGINE=InnoDB;

