-- Migration: Add PENDING status to members table
-- This allows new members to be registered as PENDING and activated by managers

SET FOREIGN_KEY_CHECKS = 0;

-- Modify the status ENUM to include PENDING
ALTER TABLE members 
MODIFY COLUMN status ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED') DEFAULT 'PENDING';

SET FOREIGN_KEY_CHECKS = 1;

