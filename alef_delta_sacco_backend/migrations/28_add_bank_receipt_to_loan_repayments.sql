-- Add bank receipt info to loan_repayments (required for bank payments)
-- Idempotent: only add columns if missing.

SET @dbname = DATABASE();
SET @tablename = 'loan_repayments';

-- bank_receipt_no
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'bank_receipt_no'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE loan_repayments ADD COLUMN bank_receipt_no VARCHAR(100) NULL AFTER payment_method'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- bank_receipt_photo_url
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'bank_receipt_photo_url'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE loan_repayments ADD COLUMN bank_receipt_photo_url VARCHAR(255) NULL AFTER bank_receipt_no'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;


