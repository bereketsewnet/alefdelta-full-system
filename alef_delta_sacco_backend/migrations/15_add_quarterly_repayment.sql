-- Add QUARTERLY option to repayment_frequency enum

ALTER TABLE loan_applications 
MODIFY COLUMN repayment_frequency ENUM('MONTHLY','WEEKLY','QUARTERLY') DEFAULT 'MONTHLY';


