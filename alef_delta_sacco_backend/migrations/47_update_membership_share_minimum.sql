INSERT INTO system_config (config_key, config_value, description)
VALUES ('min_shares_required', '10', 'Minimum shares required for membership (10 shares by current cooperative policy)')
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  description = VALUES(description);
