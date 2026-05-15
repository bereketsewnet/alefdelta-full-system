-- Add verification fields for collateral and guarantors
ALTER TABLE collateral 
ADD COLUMN verification_status ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
ADD COLUMN verified_by CHAR(36) NULL,
ADD COLUMN verified_at DATETIME NULL,
ADD COLUMN verification_notes TEXT NULL,
ADD COLUMN verified_value DECIMAL(18,2) NULL;

ALTER TABLE guarantors
ADD COLUMN verification_status ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
ADD COLUMN verified_by CHAR(36) NULL,
ADD COLUMN verified_at DATETIME NULL,
ADD COLUMN verification_notes TEXT NULL,
ADD COLUMN available_capacity DECIMAL(18,2) NULL;

-- Add telegram_chat_id to members for Telegram Mini App integration
ALTER TABLE members
ADD COLUMN telegram_chat_id VARCHAR(100) NULL UNIQUE;

-- Add updated_at to members if not exists
ALTER TABLE members
MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

