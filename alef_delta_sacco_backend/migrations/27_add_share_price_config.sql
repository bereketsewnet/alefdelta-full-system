-- Add share price + minimum shares required configuration
-- Do NOT override existing values if already set; only seed defaults and update descriptions.

INSERT INTO system_config (config_key, config_value, description) VALUES
('share_price', '300', 'Share price in ETB (used to compute member share lien)'),
('min_shares_required', '5', 'Minimum shares required for membership (used to compute member share lien)')
ON DUPLICATE KEY UPDATE
  description = VALUES(description);


