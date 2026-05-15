-- Loan Products
INSERT INTO loan_products (product_code, name, interest_rate, interest_type, min_term_months, max_term_months, penalty_rate)
VALUES
('L-EDU', 'Education Loan', 12.50, 'FLAT', 6, 24, 2.00),
('L-MED', 'Medical Loan', 12.50, 'FLAT', 6, 24, 2.00),
('L-SOC', 'Social Event Loan', 12.50, 'FLAT', 6, 24, 2.00),
('L-HSE', 'Home Construction', 17.00, 'FLAT', 12, 120, 2.50),
('L-VEH', 'Vehicle Purchase', 14.00, 'FLAT', 12, 60, 2.00),
('L-BIZ', 'Business Expansion', 14.00, 'DECLINING', 12, 60, 2.00),
('L-AGR', 'Urban Agriculture', 14.00, 'DECLINING', 12, 60, 2.00),
('L-INS', 'Insurance Loan', 12.50, 'FLAT', 6, 12, 1.50),
('SAV_STANDARD', 'Standard Loan', 12.50, 'FLAT', 6, 36, 1.50),
('DEV_GROWTH', 'Growth Loan', 16.00, 'DECLINING', 12, 48, 2.00)
ON DUPLICATE KEY UPDATE name = VALUES(name), interest_rate = VALUES(interest_rate), interest_type = VALUES(interest_type);

-- Delete existing data (to start fresh) - order matters due to foreign keys
DELETE FROM accounts;
DELETE FROM transactions;
DELETE FROM loan_applications;
DELETE FROM guarantors;
DELETE FROM collateral;
DELETE FROM beneficiaries;
DELETE FROM members;
DELETE FROM users;

-- Sample Users (Password for all: Demo1234)
INSERT INTO users (user_id, username, password_hash, role, email, phone, status)
VALUES
('11111111-1111-1111-1111-111111111111', 'admin', '$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC', 'ADMIN', 'admin@gmail.com', '+251911111111', 'ACTIVE'),
('22222222-2222-2222-2222-222222222222', 'teller', '$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC', 'TELLER', 'teller@gmail.com', '+251922222222', 'ACTIVE'),
('33333333-3333-3333-3333-333333333333', 'credit.officer', '$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC', 'CREDIT_OFFICER', 'credit.officer@gmail.com', '+251933333333', 'ACTIVE'),
('44444444-4444-4444-4444-444444444444', 'manager', '$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC', 'MANAGER', 'manager@gmail.com', '+251944444444', 'ACTIVE');

-- Sample Members (Password: Demo1234)
INSERT INTO members (member_id, membership_no, first_name, middle_name, last_name, phone_primary, email, gender, marital_status, address_subcity, address_woreda, address_house_no, member_type, monthly_income, tin_number, status, profile_photo_url, id_card_url, password_hash)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MEM-2024-0001', 'Bereket', 'Gedamu', 'Sewnet', '+251965500639', 'bereket@example.com', 'MALE', 'MARRIED', 'Bole', '04', '123', 'GOV_EMP', 35000.00, 'TIN-001', 'ACTIVE', NULL, NULL, '$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'MEM-2024-0002', 'Alemitu', NULL, 'Tesfaye', '+251965500540', 'alemitu@example.com', 'FEMALE', 'SINGLE', 'Yeka', '05', '456', 'SME', 45000.00, 'TIN-002', 'ACTIVE', NULL, NULL, '$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC');

-- Sample Accounts for Members
INSERT INTO accounts (account_id, member_id, product_code, balance, lien_amount, currency, status, version)
VALUES
('acc-1111-aaaa-bbbb-ccccdddd0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SAV_COMPULSORY', 15000.00, 0.00, 'ETB', 'ACTIVE', 1),
('acc-1111-aaaa-bbbb-ccccdddd0002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SHR_CAP', 5000.00, 0.00, 'ETB', 'ACTIVE', 1),
('acc-2222-aaaa-bbbb-ccccdddd0001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SAV_COMPULSORY', 20000.00, 0.00, 'ETB', 'ACTIVE', 1),
('acc-2222-aaaa-bbbb-ccccdddd0002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SAV_VOLUNTARY', 10000.00, 0.00, 'ETB', 'ACTIVE', 1)
ON DUPLICATE KEY UPDATE balance = VALUES(balance);

