-- Migration: Add category field to loan_products table
-- This allows categorizing loan products (Service, Asset, Business, Special, etc.)

SET FOREIGN_KEY_CHECKS = 0;

-- Add category column if it doesn't exist
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'loan_products'
    AND COLUMN_NAME = 'category'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE loan_products ADD COLUMN category VARCHAR(50) NULL',
  'SELECT "Column category already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

