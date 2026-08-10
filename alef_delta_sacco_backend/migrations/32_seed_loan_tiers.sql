INSERT INTO loan_products
  (product_code, name, interest_rate, interest_type, min_term_months, max_term_months, penalty_rate, loan_category,
   min_savings_duration_months, loan_amount_min_etb, loan_amount_max_etb,
   required_pre_savings_pct, required_share_purchase_pct, requires_lump_sum_pre_savings)
VALUES
  ('TIER-1', 'Standard Loan - Tier 1', 14.0, 'DECLINING', 1, 24, 2.00, 'STANDARD', 3, 0.00, 100000.00, 10.0, 10.0, FALSE),
  ('TIER-2', 'Standard Loan - Tier 2', 15.5, 'DECLINING', 1, 48, 2.00, 'STANDARD', 4, 100001.00, 200000.00, 10.0, 10.0, FALSE),
  ('TIER-3', 'Standard Loan - Tier 3', 15.5, 'DECLINING', 1, 48, 2.00, 'STANDARD', 5, 200001.00, 400000.00, 10.0, 10.0, FALSE),
  ('TIER-4', 'Standard Loan - Tier 4', 15.5, 'DECLINING', 1, 48, 2.00, 'STANDARD', 6, 400001.00, 1000000.00, 20.0, 10.0, FALSE),
  ('TIER-5', 'Standard Loan - Tier 5', 16.5, 'DECLINING', 1, 60, 2.00, 'STANDARD', 7, 1000001.00, 1500000.00, 20.0, 10.0, FALSE),
  ('TIER-6', 'Standard Loan - Tier 6', 16.5, 'DECLINING', 1, 60, 2.00, 'STANDARD', 8, 1500001.00, 2500000.00, 30.0, 10.0, FALSE),
  ('TIER-7', 'Standard Loan - Tier 7', 16.5, 'DECLINING', 1, 60, 2.00, 'STANDARD', 9, 2500001.00, 3500000.00, 30.0, 10.0, FALSE),
  ('TIER-8', 'Standard Loan - Tier 8', 17.0, 'DECLINING', 1, 96, 2.00, 'STANDARD', 10, 3500001.00, 7000000.00, 35.0, 15.0, FALSE),
  ('TIER-9', 'Vehicle Purchase Loan', 16.5, 'DECLINING', 1, 60, 2.00, 'VEHICLE', 3, 0.00, 3500000.00, 50.0, 10.0, TRUE),
  ('TIER-10', 'House Purchase Loan', 17.0, 'DECLINING', 1, 96, 2.00, 'HOUSING', 4, 0.00, 7000000.00, 45.0, 15.0, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  interest_rate = VALUES(interest_rate),
  loan_category = VALUES(loan_category),
  min_savings_duration_months = VALUES(min_savings_duration_months),
  loan_amount_min_etb = VALUES(loan_amount_min_etb),
  loan_amount_max_etb = VALUES(loan_amount_max_etb),
  required_pre_savings_pct = VALUES(required_pre_savings_pct),
  required_share_purchase_pct = VALUES(required_share_purchase_pct),
  requires_lump_sum_pre_savings = VALUES(requires_lump_sum_pre_savings);
