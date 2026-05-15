-- Migration: Create emergency_contacts table
-- Date: 2025-12-12

CREATE TABLE IF NOT EXISTS emergency_contacts (
  emergency_contact_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  subcity VARCHAR(120) NULL,
  woreda VARCHAR(120) NULL,
  kebele VARCHAR(100) NULL,
  house_number VARCHAR(60) NULL,
  phone_number VARCHAR(30) NOT NULL,
  relationship VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_emergency_contact_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  INDEX idx_emergency_contact_member (member_id)
) ENGINE=InnoDB;

