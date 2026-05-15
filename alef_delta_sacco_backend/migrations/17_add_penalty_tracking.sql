-- Add penalty tracking field to loan_applications

ALTER TABLE loan_applications
ADD COLUMN last_penalty_date DATE NULL AFTER last_payment_date;

-- Add comment
ALTER TABLE loan_applications
MODIFY COLUMN last_penalty_date DATE NULL COMMENT 'Last date when penalty was automatically applied';


