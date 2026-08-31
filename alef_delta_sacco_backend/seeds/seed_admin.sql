INSERT INTO users (user_id, username, password_hash, role, email, phone, status)
VALUES ('{{USER_ID}}', '{{USERNAME}}', '{{PASSWORD_HASH}}', 'ADMIN', '{{EMAIL}}', '{{PHONE}}', 'ACTIVE')
ON DUPLICATE KEY UPDATE username = VALUES(username), password_hash = VALUES(password_hash), role = 'ADMIN', email = VALUES(email), phone = VALUES(phone), status = 'ACTIVE';
