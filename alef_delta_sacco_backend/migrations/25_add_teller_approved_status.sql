-- Migration: Add TELLER_APPROVED status to member_registration_requests
-- Date: 2025-12-16

ALTER TABLE member_registration_requests
MODIFY COLUMN status ENUM('PENDING','TELLER_APPROVED','APPROVED','REJECTED') DEFAULT 'PENDING';

