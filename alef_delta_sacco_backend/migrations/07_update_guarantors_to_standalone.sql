-- Update guarantors table to remove member dependency and add static fields
SET @dbname = DATABASE();
SET @tablename = "guarantors";

-- Drop foreign key constraint if it exists
SET @fk_name = (SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = @dbname 
                AND TABLE_NAME = @tablename 
                AND COLUMN_NAME = 'guarantor_member_id' 
                AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1);

SET @preparedStatement = (SELECT IF(
  @fk_name IS NOT NULL,
  CONCAT('ALTER TABLE ', @tablename, ' DROP FOREIGN KEY ', @fk_name),
  'SELECT 1'
));
PREPARE dropFK FROM @preparedStatement;
EXECUTE dropFK;
DEALLOCATE PREPARE dropFK;

-- Drop the old guarantor_member_id column if it exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = @tablename
    AND table_schema = @dbname
    AND column_name = 'guarantor_member_id'
  ) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' DROP COLUMN guarantor_member_id'),
  'SELECT 1'
));
PREPARE dropColumn FROM @preparedStatement;
EXECUTE dropColumn;
DEALLOCATE PREPARE dropColumn;

-- Add new static fields for guarantor information
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = @tablename
    AND table_schema = @dbname
    AND column_name = 'full_name'
  ) = 0,
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN full_name VARCHAR(200) NOT NULL AFTER loan_id'),
  'SELECT 1'
));
PREPARE addFullName FROM @preparedStatement;
EXECUTE addFullName;
DEALLOCATE PREPARE addFullName;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = @tablename
    AND table_schema = @dbname
    AND column_name = 'phone'
  ) = 0,
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN phone VARCHAR(30) NOT NULL AFTER full_name'),
  'SELECT 1'
));
PREPARE addPhone FROM @preparedStatement;
EXECUTE addPhone;
DEALLOCATE PREPARE addPhone;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = @tablename
    AND table_schema = @dbname
    AND column_name = 'relationship'
  ) = 0,
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN relationship VARCHAR(100) NULL AFTER phone'),
  'SELECT 1'
));
PREPARE addRelationship FROM @preparedStatement;
EXECUTE addRelationship;
DEALLOCATE PREPARE addRelationship;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = @tablename
    AND table_schema = @dbname
    AND column_name = 'address'
  ) = 0,
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN address TEXT NULL AFTER relationship'),
  'SELECT 1'
));
PREPARE addAddress FROM @preparedStatement;
EXECUTE addAddress;
DEALLOCATE PREPARE addAddress;

