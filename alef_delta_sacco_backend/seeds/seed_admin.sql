INSERT INTO users (user_id, username, password_hash, role, email, phone, status)
VALUES ('{{USER_ID}}', '{{USERNAME}}', '{{PASSWORD_HASH}}', 'ADMIN', '{{EMAIL}}', '{{PHONE}}', 'ACTIVE')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), status = 'ACTIVE';

