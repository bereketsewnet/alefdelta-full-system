CREATE TRIGGER trg_sacco_master_ledger_no_update
BEFORE UPDATE ON sacco_master_ledger
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SACCO master ledger entries are append-only and cannot be updated';

CREATE TRIGGER trg_sacco_master_ledger_no_delete
BEFORE DELETE ON sacco_master_ledger
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SACCO master ledger entries are append-only and cannot be deleted';
