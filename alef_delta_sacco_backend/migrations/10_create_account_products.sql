-- Create account_products table
CREATE TABLE IF NOT EXISTS account_products (
  product_code VARCHAR(30) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  category VARCHAR(50) NULL,
  is_active TINYINT(1) DEFAULT 1,
  min_balance DECIMAL(18,2) DEFAULT 0,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert default account products
INSERT INTO account_products (product_code, name, description, category, is_active, min_balance, interest_rate) VALUES
('SAV_COMPULSORY', 'Savings - Compulsory', 'Compulsory savings account for all members', 'SAVINGS', 1, 0, 0),
('SAV_VOLUNTARY', 'Savings - Voluntary', 'Voluntary savings account', 'SAVINGS', 1, 0, 0),
('SAV_FIXED', 'Savings - Fixed', 'Fixed deposit account', 'SAVINGS', 1, 0, 0),
('SHR_CAP', 'Share Capital', 'Share capital account', 'SHARES', 1, 0, 0)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), category=VALUES(category);

-- Add foreign key constraint to accounts table (optional, for data integrity)
-- Note: This will only work if all existing accounts have valid product_codes
-- ALTER TABLE accounts ADD CONSTRAINT fk_account_product 
--   FOREIGN KEY (product_code) REFERENCES account_products(product_code);

