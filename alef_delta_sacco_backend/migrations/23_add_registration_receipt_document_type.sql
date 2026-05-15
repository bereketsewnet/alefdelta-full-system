-- Migration: Add REGISTRATION_RECEIPT to member_documents document_type ENUM
-- Date: 2025-12-16

ALTER TABLE member_documents 
MODIFY COLUMN document_type ENUM('KEBELE_ID', 'DRIVER_LICENSE', 'PASSPORT', 'WORKER_ID', 'REGISTRATION_RECEIPT') NOT NULL;

