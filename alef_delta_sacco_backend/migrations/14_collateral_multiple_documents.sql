-- Add support for multiple documents in collateral
-- Change from single document_url to documents JSON array
-- Note: Run this migration manually if column states don't match expectations

-- Add documents column (will fail if already exists, which is fine)
ALTER TABLE collateral
ADD COLUMN documents JSON NULL AFTER estimated_value;


