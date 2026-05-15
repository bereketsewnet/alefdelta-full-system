SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  user_id CHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','TELLER','CREDIT_OFFICER','MANAGER','AUDITOR') NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  status ENUM('ACTIVE','DISABLED') DEFAULT 'ACTIVE',
  password_changed_at DATETIME NULL,
  force_password_reset TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS members (
  member_id CHAR(36) PRIMARY KEY,
  membership_no VARCHAR(30) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_primary VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(150) NULL,
  gender ENUM('MALE','FEMALE','OTHER') NOT NULL,
  marital_status ENUM('SINGLE','MARRIED','DIVORCED','WIDOWED') NOT NULL,
  address_subcity VARCHAR(120) NULL,
  address_woreda VARCHAR(120) NULL,
  address_house_no VARCHAR(60) NULL,
  member_type ENUM('INDIVIDUAL','GOV_EMP','NGO','SME') NOT NULL,
  monthly_income DECIMAL(18,2) DEFAULT 0,
  tin_number VARCHAR(50) NULL,
  status ENUM('ACTIVE','SUSPENDED','CLOSED') DEFAULT 'ACTIVE',
  profile_photo_url VARCHAR(255) NULL,
  id_card_url VARCHAR(255) NULL,
  password_hash VARCHAR(255) NOT NULL,
  password_changed_at DATETIME NULL,
  registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS beneficiaries (
  beneficiary_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  id_front_url VARCHAR(255) NULL,
  id_back_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_beneficiary_member FOREIGN KEY (member_id) REFERENCES members(member_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS accounts (
  account_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NOT NULL,
  product_code VARCHAR(30) NOT NULL,
  balance DECIMAL(18,2) DEFAULT 0,
  lien_amount DECIMAL(18,2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'ETB',
  status ENUM('ACTIVE','FROZEN','CLOSED') DEFAULT 'ACTIVE',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_account_member FOREIGN KEY (member_id) REFERENCES members(member_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS loan_products (
  product_code VARCHAR(30) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  interest_type ENUM('FLAT','DECLINING') NOT NULL,
  min_term_months INT NOT NULL,
  max_term_months INT NOT NULL,
  penalty_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS loan_applications (
  loan_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NOT NULL,
  product_code VARCHAR(30) NOT NULL,
  applied_amount DECIMAL(18,2) NOT NULL,
  approved_amount DECIMAL(18,2) NULL,
  term_months INT NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  interest_type ENUM('FLAT','DECLINING') NOT NULL,
  purpose_description TEXT,
  repayment_frequency ENUM('MONTHLY','WEEKLY') DEFAULT 'MONTHLY',
  workflow_status ENUM('PENDING','UNDER_REVIEW','APPROVED','REJECTED') DEFAULT 'PENDING',
  disbursement_date DATE NULL,
  next_payment_date DATE NULL,
  eligibility_snapshot JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_loan_member FOREIGN KEY (member_id) REFERENCES members(member_id),
  CONSTRAINT fk_loan_product FOREIGN KEY (product_code) REFERENCES loan_products(product_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS guarantors (
  guarantor_id CHAR(36) PRIMARY KEY,
  loan_id CHAR(36) NOT NULL,
  guarantor_member_id CHAR(36) NOT NULL,
  guaranteed_amount DECIMAL(18,2) NOT NULL,
  id_front_url VARCHAR(255) NULL,
  id_back_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_guarantor_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS collateral (
  collateral_id CHAR(36) PRIMARY KEY,
  loan_id CHAR(36) NOT NULL,
  type ENUM('LAND','VEHICLE','CASH','OTHER') NOT NULL,
  description TEXT,
  estimated_value DECIMAL(18,2) NOT NULL,
  document_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_collateral_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  txn_id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  txn_type ENUM('DEPOSIT','WITHDRAWAL') NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  balance_after DECIMAL(18,2) NOT NULL,
  reference VARCHAR(120) NULL,
  receipt_photo_url VARCHAR(255) NULL,
  performed_by CHAR(36) NULL,
  idempotency_key VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transaction_account FOREIGN KEY (account_id) REFERENCES accounts(account_id),
  CONSTRAINT fk_transaction_user FOREIGN KEY (performed_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key VARCHAR(100) PRIMARY KEY,
  user_id CHAR(36) NULL,
  endpoint VARCHAR(150) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  response_json JSON NOT NULL,
  status_code INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_idempotency_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS member_otps (
  otp_id CHAR(36) PRIMARY KEY,
  member_id CHAR(36) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_member_otp_member FOREIGN KEY (member_id) REFERENCES members(member_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

