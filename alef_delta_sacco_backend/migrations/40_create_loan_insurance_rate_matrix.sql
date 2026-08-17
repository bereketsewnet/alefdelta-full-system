CREATE TABLE loan_insurance_rate_matrix (
  rate_id CHAR(36) PRIMARY KEY,
  age_min INT NOT NULL,
  age_max INT NULL,
  term_min_months INT NOT NULL,
  term_max_months INT NOT NULL,
  marital_status ENUM('SINGLE','MARRIED') NOT NULL,
  ceiling_rate DECIMAL(5,2) NOT NULL,
  configured_rate DECIMAL(5,2) NOT NULL,
  clause_reference VARCHAR(30) NOT NULL,
  UNIQUE KEY uq_insurance_matrix (age_min, age_max, term_min_months, term_max_months, marital_status)
) ENGINE=InnoDB;

INSERT INTO loan_insurance_rate_matrix (rate_id,age_min,age_max,term_min_months,term_max_months,marital_status,ceiling_rate,configured_rate,clause_reference) VALUES
(UUID(),18,45,1,12,'SINGLE',1.50,1.50,'2.5.3.1 ሀ'),(UUID(),18,45,1,12,'MARRIED',1.95,1.95,'2.5.3.1 ሀ'),
(UUID(),18,45,13,60,'SINGLE',1.75,1.75,'2.5.3.1 ለ'),(UUID(),18,45,13,60,'MARRIED',2.30,2.30,'2.5.3.1 ለ'),
(UUID(),18,45,61,120,'SINGLE',2.05,2.05,'2.5.3.1 ሐ'),(UUID(),18,45,61,120,'MARRIED',2.80,2.80,'2.5.3.1 ሐ'),
(UUID(),46,60,1,12,'SINGLE',1.95,1.95,'2.5.3.1 መ'),(UUID(),46,60,1,12,'MARRIED',2.55,2.55,'2.5.3.1 መ'),
(UUID(),46,60,13,60,'SINGLE',2.05,2.05,'2.5.3.1 ሠ'),(UUID(),46,60,13,60,'MARRIED',2.85,2.85,'2.5.3.1 ሠ'),
(UUID(),46,60,61,120,'SINGLE',2.50,2.50,'2.5.3.1 ረ'),(UUID(),46,60,61,120,'MARRIED',3.30,3.30,'2.5.3.1 ረ'),
(UUID(),61,NULL,1,12,'SINGLE',2.50,2.50,'2.5.3.1 ሰ'),(UUID(),61,NULL,1,12,'MARRIED',3.30,3.30,'2.5.3.1 ሰ'),
(UUID(),61,NULL,13,60,'SINGLE',2.60,2.60,'2.5.3.1 ሸ'),(UUID(),61,NULL,13,60,'MARRIED',3.50,3.50,'2.5.3.1 ሸ'),
(UUID(),61,NULL,61,120,'SINGLE',2.80,2.80,'2.5.3.1 ቀ'),(UUID(),61,NULL,61,120,'MARRIED',3.80,3.80,'2.5.3.1 ቀ');
