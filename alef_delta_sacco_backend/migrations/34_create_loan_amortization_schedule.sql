CREATE TABLE IF NOT EXISTS loan_amortization_schedule (
  loan_id CHAR(36) NOT NULL,
  installment_no INT NOT NULL,
  due_date DATE NOT NULL,
  opening_balance DECIMAL(18,2) NOT NULL,
  scheduled_payment DECIMAL(18,2) NOT NULL,
  scheduled_principal DECIMAL(18,2) NOT NULL,
  scheduled_interest DECIMAL(18,2) NOT NULL,
  closing_balance DECIMAL(18,2) NOT NULL,
  principal_paid DECIMAL(18,2) NOT NULL DEFAULT 0,
  interest_paid DECIMAL(18,2) NOT NULL DEFAULT 0,
  status ENUM('PENDING','PARTIAL','PAID') NOT NULL DEFAULT 'PENDING',
  paid_at DATE NULL,
  PRIMARY KEY (loan_id, installment_no),
  CONSTRAINT fk_schedule_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id),
  INDEX idx_schedule_due (loan_id, due_date, status)
) ENGINE=InnoDB;

UPDATE loan_products SET interest_type = 'DECLINING' WHERE interest_type <> 'DECLINING' OR interest_type IS NULL;
