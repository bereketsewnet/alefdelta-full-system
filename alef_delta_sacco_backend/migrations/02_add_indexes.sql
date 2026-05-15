-- Add indexes for performance

CREATE INDEX idx_members_phone ON members(phone_primary);
CREATE INDEX idx_accounts_member ON accounts(member_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX idx_loans_member ON loan_applications(member_id);
CREATE INDEX idx_beneficiaries_member ON beneficiaries(member_id);
CREATE INDEX idx_idempotency_endpoint ON idempotency_keys(endpoint);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);

