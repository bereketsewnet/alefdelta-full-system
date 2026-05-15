-- Migration: Add age field to guarantors table
-- Date: 2025-12-16

ALTER TABLE guarantors
ADD COLUMN age INT NULL AFTER address;

