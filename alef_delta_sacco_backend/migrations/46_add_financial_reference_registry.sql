CREATE TABLE IF NOT EXISTS financial_reference_registry (
  reference_key VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin PRIMARY KEY,
  reference_value VARCHAR(160) NOT NULL,
  reference_kind ENUM(
    'ACCOUNT_TRANSACTION',
    'DEPOSIT_REQUEST',
    'LOAN_REPAYMENT_REQUEST',
    'LOAN_REPAYMENT_BANK',
    'LOAN_REPAYMENT_COMPANY'
  ) NOT NULL,
  source_id CHAR(36) NOT NULL,
  member_id CHAR(36) NULL,
  status ENUM('RESERVED','POSTED','RETIRED') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  posted_at DATETIME NULL,
  UNIQUE KEY uq_financial_reference_source (reference_kind, source_id, reference_key),
  KEY idx_financial_reference_source (source_id),
  KEY idx_financial_reference_member (member_id),
  KEY idx_financial_reference_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO financial_reference_registry
  (reference_key, reference_value, reference_kind, source_id, member_id, status, created_at, posted_at)
SELECT
  UPPER(REGEXP_REPLACE(TRIM(t.reference), '[[:space:]]+', ' ')),
  TRIM(t.reference),
  'ACCOUNT_TRANSACTION',
  t.txn_id,
  a.member_id,
  'POSTED',
  t.created_at,
  t.created_at
FROM transactions t
JOIN accounts a ON a.account_id = t.account_id
WHERE t.reference IS NOT NULL AND TRIM(t.reference) <> '';

INSERT IGNORE INTO financial_reference_registry
  (reference_key, reference_value, reference_kind, source_id, member_id, status, created_at, posted_at)
SELECT
  UPPER(REGEXP_REPLACE(TRIM(lr.bank_receipt_no), '[[:space:]]+', ' ')),
  TRIM(lr.bank_receipt_no),
  'LOAN_REPAYMENT_BANK',
  lr.repayment_id,
  lr.member_id,
  'POSTED',
  lr.created_at,
  lr.created_at
FROM loan_repayments lr
WHERE lr.bank_receipt_no IS NOT NULL AND TRIM(lr.bank_receipt_no) <> '';

INSERT IGNORE INTO financial_reference_registry
  (reference_key, reference_value, reference_kind, source_id, member_id, status, created_at, posted_at)
SELECT
  UPPER(REGEXP_REPLACE(TRIM(lr.receipt_no), '[[:space:]]+', ' ')),
  TRIM(lr.receipt_no),
  'LOAN_REPAYMENT_COMPANY',
  lr.repayment_id,
  lr.member_id,
  'POSTED',
  lr.created_at,
  lr.created_at
FROM loan_repayments lr
WHERE lr.receipt_no IS NOT NULL AND TRIM(lr.receipt_no) <> '';

INSERT IGNORE INTO financial_reference_registry
  (reference_key, reference_value, reference_kind, source_id, member_id, status, created_at, posted_at)
SELECT
  UPPER(REGEXP_REPLACE(TRIM(dr.reference_number), '[[:space:]]+', ' ')),
  TRIM(dr.reference_number),
  'DEPOSIT_REQUEST',
  dr.request_id,
  dr.member_id,
  CASE WHEN dr.status = 'PENDING' THEN 'RESERVED' WHEN dr.status = 'APPROVED' THEN 'POSTED' ELSE 'RETIRED' END,
  dr.created_at,
  CASE WHEN dr.status = 'APPROVED' THEN dr.approved_at ELSE NULL END
FROM deposit_requests dr
WHERE dr.reference_number IS NOT NULL AND TRIM(dr.reference_number) <> '';

INSERT IGNORE INTO financial_reference_registry
  (reference_key, reference_value, reference_kind, source_id, member_id, status, created_at, posted_at)
SELECT
  UPPER(REGEXP_REPLACE(TRIM(lrr.receipt_number), '[[:space:]]+', ' ')),
  TRIM(lrr.receipt_number),
  'LOAN_REPAYMENT_REQUEST',
  lrr.request_id,
  lrr.member_id,
  CASE WHEN lrr.status = 'PENDING' THEN 'RESERVED' WHEN lrr.status = 'APPROVED' THEN 'POSTED' ELSE 'RETIRED' END,
  lrr.created_at,
  CASE WHEN lrr.status = 'APPROVED' THEN lrr.approved_at ELSE NULL END
FROM loan_repayment_requests lrr
WHERE lrr.receipt_number IS NOT NULL AND TRIM(lrr.receipt_number) <> '';

