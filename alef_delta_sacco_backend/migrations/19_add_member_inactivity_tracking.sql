-- Add member inactivity tracking and lifecycle management

-- Update member status enum to include INACTIVE and TERMINATED
ALTER TABLE members
MODIFY COLUMN status ENUM('ACTIVE','INACTIVE','SUSPENDED','TERMINATED','CLOSED','PENDING') DEFAULT 'PENDING';

-- Add inactivity tracking fields
ALTER TABLE members
ADD COLUMN last_activity_date DATE NULL AFTER registered_date,
ADD COLUMN inactivity_days INT DEFAULT 0 AFTER last_activity_date,
ADD COLUMN auto_status_changed_at DATETIME NULL AFTER inactivity_days,
ADD COLUMN reactivation_notes TEXT NULL AFTER auto_status_changed_at;

-- Add comments
ALTER TABLE members
MODIFY COLUMN last_activity_date DATE NULL COMMENT 'Last date of any transaction or loan activity',
MODIFY COLUMN inactivity_days INT DEFAULT 0 COMMENT 'Consecutive days of inactivity',
MODIFY COLUMN auto_status_changed_at DATETIME NULL COMMENT 'When status was automatically changed due to inactivity',
MODIFY COLUMN reactivation_notes TEXT NULL COMMENT 'Notes from manager when reactivating member';

-- Create system configuration table for dynamic settings
CREATE TABLE IF NOT EXISTS system_config (
  config_key VARCHAR(100) PRIMARY KEY,
  config_value TEXT NOT NULL,
  description TEXT NULL,
  updated_by CHAR(36) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_config_user FOREIGN KEY (updated_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Insert default inactivity configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('member_inactive_days', '90', 'Days of inactivity before member becomes INACTIVE (default 90 = 3 months)'),
('member_terminated_days', '365', 'Days of inactivity before member becomes TERMINATED (default 365 = 1 year)'),
('inactivity_check_enabled', 'true', 'Enable automatic inactivity status updates'),
('penalty_rate_default', '2.0', 'Default penalty rate for overdue loans (%)')
ON DUPLICATE KEY UPDATE 
  config_value = VALUES(config_value),
  description = VALUES(description);

-- Initialize last_activity_date for existing members
UPDATE members 
SET last_activity_date = COALESCE(
  (SELECT MAX(created_at) FROM transactions WHERE account_id IN (SELECT account_id FROM accounts WHERE members.member_id = accounts.member_id)),
  registered_date
)
WHERE last_activity_date IS NULL;


