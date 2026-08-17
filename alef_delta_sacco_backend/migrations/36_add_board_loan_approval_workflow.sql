ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN','TELLER','CREDIT_OFFICER','MANAGER','AUDITOR','BOARD_MEMBER') NOT NULL;

CREATE TABLE loan_approval_votes (
  vote_id CHAR(36) PRIMARY KEY,
  loan_id CHAR(36) NOT NULL,
  voter_id CHAR(36) NOT NULL,
  voter_role ENUM('MANAGER','ADMIN','BOARD_MEMBER') NOT NULL,
  decision ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  reason TEXT NULL,
  decided_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_loan_voter (loan_id, voter_id),
  CONSTRAINT fk_loan_vote_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id),
  CONSTRAINT fk_loan_vote_user FOREIGN KEY (voter_id) REFERENCES users(user_id)
) ENGINE=InnoDB;
