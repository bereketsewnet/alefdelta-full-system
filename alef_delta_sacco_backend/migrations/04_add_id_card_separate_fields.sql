-- Add separate ID card front and back fields (if they don't exist)
SET @dbname = DATABASE();
SET @tablename = "members";
SET @columnname1 = "id_card_front_url";
SET @columnname2 = "id_card_back_url";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname1)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname1, " VARCHAR(255) NULL AFTER id_card_url")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname2, " VARCHAR(255) NULL AFTER id_card_front_url")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Migrate existing id_card_url to id_card_front_url if it exists and id_card_front_url is null
UPDATE members 
SET id_card_front_url = id_card_url 
WHERE id_card_url IS NOT NULL AND id_card_front_url IS NULL;

-- Keep id_card_url for backward compatibility (can be removed later if needed)

