ALTER TABLE loan_applications
  ADD COLUMN fee_payment_method ENUM('DEDUCT_FROM_LOAN','OUT_OF_POCKET') NULL AFTER insurance_renewal_date,
  ADD COLUMN fee_receipt_number VARCHAR(120) NULL AFTER fee_payment_method,
  ADD COLUMN fee_receipt_url VARCHAR(500) NULL AFTER fee_receipt_number,
  ADD COLUMN gross_disbursement_amount DECIMAL(18,2) NULL AFTER fee_receipt_url,
  ADD COLUMN total_upfront_fee_amount DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER gross_disbursement_amount,
  ADD COLUMN net_disbursement_amount DECIMAL(18,2) NULL AFTER total_upfront_fee_amount,
  ADD COLUMN fee_collection_status ENUM('PENDING','COLLECTED') NOT NULL DEFAULT 'PENDING' AFTER net_disbursement_amount,
  ADD COLUMN fees_collected_at DATETIME NULL AFTER fee_collection_status,
  ADD COLUMN fees_collected_by CHAR(36) NULL AFTER fees_collected_at,
  ADD COLUMN service_charge_ledger_id CHAR(36) NULL AFTER fees_collected_by,
  ADD COLUMN insurance_escrow_status ENUM('PENDING','HELD','RECOGNIZED','UTILIZED','NOT_APPLICABLE') NOT NULL DEFAULT 'PENDING' AFTER service_charge_ledger_id,
  ADD COLUMN insurance_held_ledger_id CHAR(36) NULL AFTER insurance_escrow_status,
  ADD COLUMN insurance_resolution_ledger_id CHAR(36) NULL AFTER insurance_held_ledger_id,
  ADD COLUMN insurance_claim_made TINYINT(1) NULL AFTER insurance_resolution_ledger_id,
  ADD COLUMN insurance_closure_reason TEXT NULL AFTER insurance_claim_made,
  ADD COLUMN loan_closed_at DATETIME NULL AFTER insurance_closure_reason,
  ADD COLUMN loan_closed_by CHAR(36) NULL AFTER loan_closed_at,
  ADD COLUMN closure_idempotency_key VARCHAR(150) NULL AFTER loan_closed_by,
  ADD UNIQUE KEY uq_loan_closure_idempotency (closure_idempotency_key),
  ADD CONSTRAINT fk_loan_fee_collector FOREIGN KEY (fees_collected_by) REFERENCES users(user_id),
  ADD CONSTRAINT fk_loan_service_charge_ledger FOREIGN KEY (service_charge_ledger_id) REFERENCES sacco_master_ledger(ledger_id),
  ADD CONSTRAINT fk_loan_insurance_held_ledger FOREIGN KEY (insurance_held_ledger_id) REFERENCES sacco_master_ledger(ledger_id),
  ADD CONSTRAINT fk_loan_insurance_resolution_ledger FOREIGN KEY (insurance_resolution_ledger_id) REFERENCES sacco_master_ledger(ledger_id),
  ADD CONSTRAINT fk_loan_closer FOREIGN KEY (loan_closed_by) REFERENCES users(user_id);

UPDATE loan_applications
SET insurance_escrow_status = 'NOT_APPLICABLE'
WHERE fee_payment_method IS NULL;

ALTER TABLE loan_applications
  MODIFY COLUMN workflow_status ENUM('PENDING','UNDER_REVIEW','APPROVED','REJECTED','CLOSED') DEFAULT 'PENDING';

ALTER TABLE sacco_master_ledger
  MODIFY COLUMN entry_type ENUM(
    'REGISTRATION_FEE','LOAN_INTEREST','LOAN_PENALTY','SAVINGS_INTEREST',
    'MANUAL_REVENUE','MANUAL_EXPENSE','OPENING_ADJUSTMENT','DIVIDEND_PAYOUT','REVERSAL',
    'SERVICE_CHARGE_INFLOW','INSURANCE_HELD','UNUTILIZED_INSURANCE_REVENUE','INSURANCE_CLAIM_UTILIZED'
  ) NOT NULL,
  ADD COLUMN affects_balance TINYINT(1) NOT NULL DEFAULT 1 AFTER affects_profit;
