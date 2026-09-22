ALTER TABLE transactions
  ADD COLUMN bank_receipt_no VARCHAR(160) NULL AFTER receipt_photo_url,
  ADD COLUMN bank_receipt_photo_url VARCHAR(255) NULL AFTER bank_receipt_no,
  ADD COLUMN remark TEXT NULL AFTER bank_receipt_photo_url,
  ADD INDEX idx_transactions_bank_receipt_no (bank_receipt_no);

ALTER TABLE financial_reference_registry
  MODIFY COLUMN reference_kind ENUM(
    'ACCOUNT_TRANSACTION',
    'ACCOUNT_TRANSACTION_BANK',
    'DEPOSIT_REQUEST',
    'LOAN_REPAYMENT_REQUEST',
    'LOAN_REPAYMENT_BANK',
    'LOAN_REPAYMENT_COMPANY'
  ) NOT NULL;
