-- Migration: Create member_documents table for additional document types
-- Date: 2025-12-12

CREATE TABLE IF NOT EXISTS member_documents (
  document_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NOT NULL,
  document_type ENUM('KEBELE_ID', 'DRIVER_LICENSE', 'PASSPORT', 'WORKER_ID') NOT NULL,
  document_number VARCHAR(100) NULL,
  front_photo_url VARCHAR(255) NULL,
  back_photo_url VARCHAR(255) NULL,
  is_verified TINYINT(1) DEFAULT 0,
  verified_by CHAR(36) NULL,
  verified_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_document_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT fk_document_verifier FOREIGN KEY (verified_by) REFERENCES users(user_id),
  INDEX idx_document_member (member_id),
  INDEX idx_document_type (document_type)
) ENGINE=InnoDB;

