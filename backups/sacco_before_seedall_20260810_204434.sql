-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: alef_delta_sacco
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_products`
--

DROP TABLE IF EXISTS `account_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_products` (
  `product_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_type` enum('STANDARD','CHILD','IN_KIND','MICRO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STANDARD',
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_kind` enum('STANDARD','CHILDREN','IN_KIND','MICRO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STANDARD',
  `guardian_required` tinyint(1) NOT NULL DEFAULT '0',
  `commodity_required` tinyint(1) NOT NULL DEFAULT '0',
  `target_required` tinyint(1) NOT NULL DEFAULT '0',
  `default_commodity_type` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `min_balance` decimal(18,2) DEFAULT '0.00',
  `min_deposit` decimal(18,2) NOT NULL DEFAULT '0.00',
  `interest_rate` decimal(5,2) DEFAULT '0.00',
  `interest_method` enum('STANDARD','NON_INTEREST','PROFIT_SHARING') COLLATE utf8mb4_unicode_ci DEFAULT 'STANDARD',
  `profit_share_ratio` decimal(5,2) DEFAULT '0.00',
  `withdrawal_policy` text COLLATE utf8mb4_unicode_ci,
  `metadata_schema` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `requires_guardian` tinyint(1) NOT NULL DEFAULT '0',
  `accepts_in_kind` tinyint(1) NOT NULL DEFAULT '0',
  `in_kind_units` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auto_convert_in_kind` tinyint(1) NOT NULL DEFAULT '1',
  `min_monthly_deposit` decimal(18,2) NOT NULL DEFAULT '0.00',
  `withdrawal_notice_days` int NOT NULL DEFAULT '0',
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_products`
--

LOCK TABLES `account_products` WRITE;
/*!40000 ALTER TABLE `account_products` DISABLE KEYS */;
INSERT INTO `account_products` VALUES ('SAV_CHILD','Children\'s Savings','CHILD','Guardian-managed savings for minors','FAMILY','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-10 13:26:46',1,0,NULL,1,100.00,0,'{\"notes\": \"Guardian approval required for withdrawals\"}'),('SAV_COMPULSORY','Savings - Compulsory','STANDARD','Compulsory savings account for all members','SAVINGS','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-10 13:26:46',0,0,NULL,1,0.00,0,NULL),('SAV_FIXED','Savings - Fixed','STANDARD','Fixed deposit account','SAVINGS','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-10 13:26:46',0,0,NULL,1,0.00,0,NULL),('SAV_IN_KIND','In-Kind Savings','IN_KIND','Commodity-based savings converted on demand','IN_KIND','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-10 13:26:46',0,1,'kg or units',0,0.00,0,'{\"notes\": \"Record commodity type and storage location\"}'),('SAV_MICRO','Micro Savings','MICRO','Low-balance, high-frequency savings product','MICRO','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-10 13:26:46',0,0,NULL,1,50.00,0,'{\"notes\": \"Ideal for daily micro-deposits\"}'),('SAV_VOLUNTARY','Savings - Voluntary','STANDARD','Voluntary savings account','SAVINGS','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-10 13:26:46',0,0,NULL,1,0.00,0,NULL),('SHR_CAP','Share Capital','STANDARD','Share capital account','SHARES','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-10 13:26:46',0,0,NULL,1,0.00,0,NULL);
/*!40000 ALTER TABLE `account_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `account_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` decimal(18,2) DEFAULT '0.00',
  `lien_amount` decimal(18,2) DEFAULT '0.00',
  `currency` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT 'ETB',
  `interest_method` enum('STANDARD','NON_INTEREST','PROFIT_SHARING') COLLATE utf8mb4_unicode_ci DEFAULT 'STANDARD',
  `metadata` json DEFAULT NULL,
  `status` enum('ACTIVE','FROZEN','CLOSED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `version` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_interest_date` date DEFAULT NULL COMMENT 'Last date interest was calculated and applied',
  `interest_earned_ytd` decimal(18,2) DEFAULT '0.00' COMMENT 'Year-to-date interest earned',
  `month_opening_balance` decimal(18,2) DEFAULT NULL COMMENT 'Balance at start of current month (for deposit interest)',
  `month_minimum_balance` decimal(18,2) DEFAULT NULL COMMENT 'Minimum balance during month (for withdrawal interest)',
  PRIMARY KEY (`account_id`),
  KEY `idx_accounts_member` (`member_id`),
  CONSTRAINT `fk_account_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `audit_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`),
  KEY `fk_audit_user` (`user_id`),
  KEY `idx_audit_entity` (`entity`,`entity_id`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `beneficiaries`
--

DROP TABLE IF EXISTS `beneficiaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `beneficiaries` (
  `beneficiary_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_front_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_back_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`beneficiary_id`),
  KEY `idx_beneficiaries_member` (`member_id`),
  CONSTRAINT `fk_beneficiary_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `beneficiaries`
--

LOCK TABLES `beneficiaries` WRITE;
/*!40000 ALTER TABLE `beneficiaries` DISABLE KEYS */;
/*!40000 ALTER TABLE `beneficiaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `collateral`
--

DROP TABLE IF EXISTS `collateral`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `collateral` (
  `collateral_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('LAND','VEHICLE','CASH','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `estimated_value` decimal(18,2) NOT NULL,
  `documents` json DEFAULT NULL,
  `document_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verification_status` enum('PENDING','VERIFIED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `verified_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verification_notes` text COLLATE utf8mb4_unicode_ci,
  `verified_value` decimal(18,2) DEFAULT NULL,
  PRIMARY KEY (`collateral_id`),
  KEY `fk_collateral_loan` (`loan_id`),
  CONSTRAINT `fk_collateral_loan` FOREIGN KEY (`loan_id`) REFERENCES `loan_applications` (`loan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `collateral`
--

LOCK TABLES `collateral` WRITE;
/*!40000 ALTER TABLE `collateral` DISABLE KEYS */;
/*!40000 ALTER TABLE `collateral` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deposit_requests`
--

DROP TABLE IF EXISTS `deposit_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deposit_requests` (
  `request_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `fk_deposit_request_account` (`account_id`),
  KEY `fk_deposit_request_approver` (`approved_by`),
  KEY `idx_deposit_requests_member` (`member_id`),
  KEY `idx_deposit_requests_status` (`status`),
  KEY `idx_deposit_requests_created` (`created_at` DESC),
  CONSTRAINT `fk_deposit_request_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`),
  CONSTRAINT `fk_deposit_request_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_deposit_request_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deposit_requests`
--

LOCK TABLES `deposit_requests` WRITE;
/*!40000 ALTER TABLE `deposit_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `deposit_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emergency_contacts`
--

DROP TABLE IF EXISTS `emergency_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emergency_contacts` (
  `emergency_contact_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subcity` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `woreda` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kebele` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `house_number` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`emergency_contact_id`),
  KEY `idx_emergency_contact_member` (`member_id`),
  CONSTRAINT `fk_emergency_contact_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emergency_contacts`
--

LOCK TABLES `emergency_contacts` WRITE;
/*!40000 ALTER TABLE `emergency_contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `emergency_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guarantors`
--

DROP TABLE IF EXISTS `guarantors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guarantors` (
  `guarantor_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `age` int DEFAULT NULL,
  `guaranteed_amount` decimal(18,2) NOT NULL,
  `id_front_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_back_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verification_status` enum('PENDING','VERIFIED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `verified_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verification_notes` text COLLATE utf8mb4_unicode_ci,
  `available_capacity` decimal(18,2) DEFAULT NULL,
  `profile_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duty_value` decimal(18,2) DEFAULT NULL,
  PRIMARY KEY (`guarantor_id`),
  KEY `fk_guarantor_loan` (`loan_id`),
  CONSTRAINT `fk_guarantor_loan` FOREIGN KEY (`loan_id`) REFERENCES `loan_applications` (`loan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guarantors`
--

LOCK TABLES `guarantors` WRITE;
/*!40000 ALTER TABLE `guarantors` DISABLE KEYS */;
/*!40000 ALTER TABLE `guarantors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `idempotency_keys`
--

DROP TABLE IF EXISTS `idempotency_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `idempotency_keys` (
  `idempotency_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endpoint` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `response_json` json NOT NULL,
  `status_code` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idempotency_key`),
  KEY `fk_idempotency_user` (`user_id`),
  KEY `idx_idempotency_endpoint` (`endpoint`),
  CONSTRAINT `fk_idempotency_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `idempotency_keys`
--

LOCK TABLES `idempotency_keys` WRITE;
/*!40000 ALTER TABLE `idempotency_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `idempotency_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interest_postings`
--

DROP TABLE IF EXISTS `interest_postings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interest_postings` (
  `posting_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `posting_date` date NOT NULL,
  `interest_amount` decimal(18,2) NOT NULL,
  `calculation_method` enum('OPENING_BALANCE','MINIMUM_BALANCE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance_used` decimal(18,2) NOT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `days_in_month` int NOT NULL DEFAULT '30',
  `balance_before` decimal(18,2) NOT NULL,
  `balance_after` decimal(18,2) NOT NULL,
  `posting_month` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'YYYY-MM format',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`posting_id`),
  UNIQUE KEY `unique_account_month` (`account_id`,`posting_month`),
  KEY `fk_interest_member` (`member_id`),
  KEY `idx_interest_date` (`posting_date`),
  KEY `idx_interest_month` (`posting_month`),
  CONSTRAINT `fk_interest_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`),
  CONSTRAINT `fk_interest_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interest_postings`
--

LOCK TABLES `interest_postings` WRITE;
/*!40000 ALTER TABLE `interest_postings` DISABLE KEYS */;
/*!40000 ALTER TABLE `interest_postings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_applications`
--

DROP TABLE IF EXISTS `loan_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_applications` (
  `loan_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_amount` decimal(18,2) NOT NULL,
  `approved_amount` decimal(18,2) DEFAULT NULL,
  `outstanding_balance` decimal(18,2) DEFAULT NULL,
  `total_paid` decimal(18,2) DEFAULT '0.00',
  `total_penalty` decimal(18,2) DEFAULT '0.00',
  `term_months` int NOT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `interest_type` enum('FLAT','DECLINING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose_description` text COLLATE utf8mb4_unicode_ci,
  `repayment_frequency` enum('MONTHLY','WEEKLY','QUARTERLY') COLLATE utf8mb4_unicode_ci DEFAULT 'MONTHLY',
  `workflow_status` enum('PENDING','UNDER_REVIEW','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `disbursement_date` date DEFAULT NULL,
  `next_payment_date` date DEFAULT NULL,
  `last_payment_date` date DEFAULT NULL,
  `last_penalty_date` date DEFAULT NULL COMMENT 'Last date when penalty was automatically applied',
  `payments_made` int DEFAULT '0',
  `is_fully_paid` tinyint(1) DEFAULT '0',
  `eligibility_snapshot` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`loan_id`),
  KEY `fk_loan_product` (`product_code`),
  KEY `idx_loans_member` (`member_id`),
  KEY `idx_loans_next_payment` (`next_payment_date`),
  CONSTRAINT `fk_loan_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  CONSTRAINT `fk_loan_product` FOREIGN KEY (`product_code`) REFERENCES `loan_products` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_applications`
--

LOCK TABLES `loan_applications` WRITE;
/*!40000 ALTER TABLE `loan_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `loan_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_products`
--

DROP TABLE IF EXISTS `loan_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_products` (
  `product_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `interest_type` enum('FLAT','DECLINING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_term_months` int NOT NULL,
  `max_term_months` int NOT NULL,
  `penalty_rate` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `min_savings_duration_months` int DEFAULT NULL,
  `loan_amount_min_etb` decimal(18,2) DEFAULT NULL,
  `loan_amount_max_etb` decimal(18,2) DEFAULT NULL,
  `required_pre_savings_pct` decimal(5,2) DEFAULT NULL,
  `required_share_purchase_pct` decimal(5,2) DEFAULT NULL,
  `requires_lump_sum_pre_savings` tinyint(1) NOT NULL DEFAULT '0',
  `loan_category` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `eligible_savings_types` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Comma-separated list of savings account product codes that count toward pre-savings check. NULL means all SAV accounts.',
  PRIMARY KEY (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_products`
--

LOCK TABLES `loan_products` WRITE;
/*!40000 ALTER TABLE `loan_products` DISABLE KEYS */;
INSERT INTO `loan_products` VALUES ('TIER-1','Standard Loan - Tier 1',14.00,'DECLINING',1,24,2.00,'2026-08-10 13:26:50',NULL,3,0.00,100000.00,10.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-10','House Purchase Loan',17.00,'DECLINING',1,96,2.00,'2026-08-10 13:26:50',NULL,4,0.00,7000000.00,45.00,15.00,1,'HOUSING','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-2','Standard Loan - Tier 2',15.50,'DECLINING',1,48,2.00,'2026-08-10 13:26:50',NULL,4,100001.00,200000.00,10.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-3','Standard Loan - Tier 3',15.50,'DECLINING',1,48,2.00,'2026-08-10 13:26:50',NULL,5,200001.00,400000.00,10.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-4','Standard Loan - Tier 4',15.50,'DECLINING',1,48,2.00,'2026-08-10 13:26:50',NULL,6,400001.00,1000000.00,20.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-5','Standard Loan - Tier 5',16.50,'DECLINING',1,60,2.00,'2026-08-10 13:26:50',NULL,7,1000001.00,1500000.00,20.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-6','Standard Loan - Tier 6',16.50,'DECLINING',1,60,2.00,'2026-08-10 13:26:50',NULL,8,1500001.00,2500000.00,30.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-7','Standard Loan - Tier 7',16.50,'DECLINING',1,60,2.00,'2026-08-10 13:26:50',NULL,9,2500001.00,3500000.00,30.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-8','Standard Loan - Tier 8',17.00,'DECLINING',1,96,2.00,'2026-08-10 13:26:50',NULL,10,3500001.00,7000000.00,35.00,15.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-9','Vehicle Purchase Loan',16.50,'DECLINING',1,60,2.00,'2026-08-10 13:26:50',NULL,3,0.00,3500000.00,50.00,10.00,1,'VEHICLE','SAV_COMPULSORY,SAV_VOLUNTARY');
/*!40000 ALTER TABLE `loan_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_repayment_requests`
--

DROP TABLE IF EXISTS `loan_repayment_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_repayment_requests` (
  `request_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `payment_method` enum('CASH','BANK_TRANSFER','MOBILE_MONEY','CHECK') COLLATE utf8mb4_unicode_ci DEFAULT 'CASH',
  `receipt_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `fk_loan_repayment_request_approver` (`approved_by`),
  KEY `idx_loan_repayment_requests_member` (`member_id`),
  KEY `idx_loan_repayment_requests_loan` (`loan_id`),
  KEY `idx_loan_repayment_requests_status` (`status`),
  KEY `idx_loan_repayment_requests_created` (`created_at` DESC),
  CONSTRAINT `fk_loan_repayment_request_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_loan_repayment_request_loan` FOREIGN KEY (`loan_id`) REFERENCES `loan_applications` (`loan_id`),
  CONSTRAINT `fk_loan_repayment_request_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_repayment_requests`
--

LOCK TABLES `loan_repayment_requests` WRITE;
/*!40000 ALTER TABLE `loan_repayment_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `loan_repayment_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_repayments`
--

DROP TABLE IF EXISTS `loan_repayments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_repayments` (
  `repayment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` date NOT NULL,
  `amount_paid` decimal(18,2) NOT NULL,
  `principal_paid` decimal(18,2) NOT NULL DEFAULT '0.00',
  `interest_paid` decimal(18,2) NOT NULL DEFAULT '0.00',
  `penalty_paid` decimal(18,2) NOT NULL DEFAULT '0.00',
  `balance_before` decimal(18,2) NOT NULL,
  `balance_after` decimal(18,2) NOT NULL,
  `payment_method` enum('CASH','BANK_TRANSFER','MOBILE_MONEY','CHECK') COLLATE utf8mb4_unicode_ci DEFAULT 'CASH',
  `bank_receipt_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_receipt_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `performed_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `idempotency_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`repayment_id`),
  UNIQUE KEY `idempotency_key` (`idempotency_key`),
  KEY `fk_repayment_user` (`performed_by`),
  KEY `idx_repayments_loan` (`loan_id`),
  KEY `idx_repayments_member` (`member_id`),
  KEY `idx_repayments_date` (`payment_date`),
  CONSTRAINT `fk_repayment_loan` FOREIGN KEY (`loan_id`) REFERENCES `loan_applications` (`loan_id`),
  CONSTRAINT `fk_repayment_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  CONSTRAINT `fk_repayment_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_repayments`
--

LOCK TABLES `loan_repayments` WRITE;
/*!40000 ALTER TABLE `loan_repayments` DISABLE KEYS */;
/*!40000 ALTER TABLE `loan_repayments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_requests`
--

DROP TABLE IF EXISTS `loan_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_requests` (
  `request_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loan_purpose` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `other_purpose` text COLLATE utf8mb4_unicode_ci,
  `requested_amount` decimal(18,2) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `fk_loan_request_approver` (`approved_by`),
  KEY `idx_loan_requests_member` (`member_id`),
  KEY `idx_loan_requests_phone` (`phone`),
  KEY `idx_loan_requests_status` (`status`),
  KEY `idx_loan_requests_created` (`created_at` DESC),
  CONSTRAINT `fk_loan_request_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_loan_request_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_requests`
--

LOCK TABLES `loan_requests` WRITE;
/*!40000 ALTER TABLE `loan_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `loan_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_documents`
--

DROP TABLE IF EXISTS `member_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_documents` (
  `document_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` enum('KEBELE_ID','DRIVER_LICENSE','PASSPORT','WORKER_ID','REGISTRATION_RECEIPT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `front_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `back_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `verified_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`),
  KEY `fk_document_verifier` (`verified_by`),
  KEY `idx_document_member` (`member_id`),
  KEY `idx_document_type` (`document_type`),
  CONSTRAINT `fk_document_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_document_verifier` FOREIGN KEY (`verified_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_documents`
--

LOCK TABLES `member_documents` WRITE;
/*!40000 ALTER TABLE `member_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_otps`
--

DROP TABLE IF EXISTS `member_otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_otps` (
  `otp_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`otp_id`),
  KEY `fk_member_otp_member` (`member_id`),
  CONSTRAINT `fk_member_otp_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_otps`
--

LOCK TABLES `member_otps` WRITE;
/*!40000 ALTER TABLE `member_otps` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_registration_requests`
--

DROP TABLE IF EXISTS `member_registration_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_registration_requests` (
  `request_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_data` json NOT NULL,
  `status` enum('PENDING','TELLER_APPROVED','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `fk_registration_request_approver` (`approved_by`),
  KEY `idx_registration_requests_status` (`status`),
  KEY `idx_registration_requests_created` (`created_at` DESC),
  CONSTRAINT `fk_registration_request_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_registration_requests`
--

LOCK TABLES `member_registration_requests` WRITE;
/*!40000 ALTER TABLE `member_registration_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_registration_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `members` (
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `membership_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_primary` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `marital_status` enum('SINGLE','MARRIED','DIVORCED','WIDOWED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `age` int DEFAULT NULL,
  `family_size_female` int DEFAULT '0',
  `family_size_male` int DEFAULT '0',
  `educational_level` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `occupation` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_experience_years` int DEFAULT NULL,
  `address_subcity` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_woreda` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_kebele` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_area_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `national_id_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shares_requested` int DEFAULT '0',
  `terms_accepted` tinyint(1) DEFAULT '0',
  `terms_accepted_at` datetime DEFAULT NULL,
  `address_house_no` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_type` enum('INDIVIDUAL','GOV_EMP','NGO','SME') COLLATE utf8mb4_unicode_ci NOT NULL,
  `monthly_income` decimal(18,2) DEFAULT '0.00',
  `tin_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','SUSPENDED','TERMINATED','CLOSED','PENDING') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `profile_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_card_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_card_front_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_card_back_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `registered_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity_date` date DEFAULT NULL COMMENT 'Last date of any transaction or loan activity',
  `inactivity_days` int DEFAULT '0' COMMENT 'Consecutive days of inactivity',
  `auto_status_changed_at` datetime DEFAULT NULL COMMENT 'When status was automatically changed due to inactivity',
  `reactivation_notes` text COLLATE utf8mb4_unicode_ci COMMENT 'Notes from manager when reactivating member',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `telegram_chat_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `membership_no` (`membership_no`),
  UNIQUE KEY `phone_primary` (`phone_primary`),
  UNIQUE KEY `telegram_chat_id` (`telegram_chat_id`),
  KEY `idx_members_phone` (`phone_primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `members`
--

LOCK TABLES `members` WRITE;
/*!40000 ALTER TABLE `members` DISABLE KEYS */;
/*!40000 ALTER TABLE `members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('DEPOSIT','WITHDRAWAL','LOAN_APPROVED','LOAN_REJECTED','LOAN_DISBURSED','LOAN_REPAYMENT','LOAN_REPAYMENT_APPROVED','LOAN_REPAYMENT_REJECTED','DEPOSIT_REQUEST_APPROVED','DEPOSIT_REQUEST_REJECTED','PENALTY_APPLIED','INTEREST_CREDITED','ACCOUNT_FROZEN','ACCOUNT_UNFROZEN','PROFILE_UPDATE','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_type` (`type`),
  CONSTRAINT `fk_notification_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_requests`
--

DROP TABLE IF EXISTS `partner_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partner_requests` (
  `request_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_type` enum('PARTNERSHIP','SPONSORSHIP') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sponsorship_type` enum('PLATINUM','GOLD','SILVER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `fk_partner_request_approver` (`approved_by`),
  KEY `idx_partner_requests_status` (`status`),
  KEY `idx_partner_requests_type` (`request_type`),
  KEY `idx_partner_requests_created` (`created_at` DESC),
  CONSTRAINT `fk_partner_request_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_requests`
--

LOCK TABLES `partner_requests` WRITE;
/*!40000 ALTER TABLE `partner_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`migration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES ('01_init_schema.sql','2026-08-10 13:26:44'),('02_add_indexes.sql','2026-08-10 13:26:44'),('03_add_verification_fields.sql','2026-08-10 13:26:45'),('04_add_id_card_separate_fields.sql','2026-08-10 13:26:45'),('05_add_beneficiary_profile_photo.sql','2026-08-10 13:26:45'),('06_add_guarantor_profile_and_duty.sql','2026-08-10 13:26:45'),('07_update_guarantors_to_standalone.sql','2026-08-10 13:26:46'),('08_add_pending_status_to_members.sql','2026-08-10 13:26:46'),('09_add_category_to_loan_products.sql','2026-08-10 13:26:46'),('10_create_account_products.sql','2026-08-10 13:26:46'),('11_expand_account_products.sql','2026-08-10 13:26:46'),('12_add_system_jobs_and_takaful.sql','2026-08-10 13:26:46'),('13_create_deposit_requests.sql','2026-08-10 13:26:46'),('14_collateral_multiple_documents.sql','2026-08-10 13:26:46'),('14_create_loan_repayment_requests.sql','2026-08-10 13:26:46'),('15_add_quarterly_repayment.sql','2026-08-10 13:26:46'),('16_create_loan_repayments.sql','2026-08-10 13:26:47'),('17_add_penalty_tracking.sql','2026-08-10 13:26:47'),('17_create_notifications.sql','2026-08-10 13:26:47'),('18_add_interest_tracking.sql','2026-08-10 13:26:48'),('19_add_member_inactivity_tracking.sql','2026-08-10 13:26:48'),('20_update_member_registration_fields.sql','2026-08-10 13:26:49'),('21_create_emergency_contacts.sql','2026-08-10 13:26:49'),('22_create_member_documents.sql','2026-08-10 13:26:49'),('23_add_registration_receipt_document_type.sql','2026-08-10 13:26:49'),('24_create_member_registration_requests.sql','2026-08-10 13:26:49'),('25_add_teller_approved_status.sql','2026-08-10 13:26:49'),('26_add_age_to_guarantors.sql','2026-08-10 13:26:49'),('27_add_share_price_config.sql','2026-08-10 13:26:49'),('28_add_bank_receipt_to_loan_repayments.sql','2026-08-10 13:26:50'),('29_create_partner_requests.sql','2026-08-10 13:26:50'),('30_create_loan_requests.sql','2026-08-10 13:26:50'),('31_add_tier_fields_to_loan_products.sql','2026-08-10 13:26:50'),('32_seed_loan_tiers.sql','2026-08-10 13:26:50'),('33_add_eligible_savings_types.sql','2026-08-10 13:26:50');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_config`
--

DROP TABLE IF EXISTS `system_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_config` (
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_key`),
  KEY `fk_config_user` (`updated_by`),
  CONSTRAINT `fk_config_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_config`
--

LOCK TABLES `system_config` WRITE;
/*!40000 ALTER TABLE `system_config` DISABLE KEYS */;
INSERT INTO `system_config` VALUES ('inactivity_check_enabled','true','Enable automatic inactivity status updates',NULL,'2026-08-10 13:26:48'),('member_inactive_days','90','Days of inactivity before member becomes INACTIVE (default 90 = 3 months)',NULL,'2026-08-10 13:26:48'),('member_terminated_days','365','Days of inactivity before member becomes TERMINATED (default 365 = 1 year)',NULL,'2026-08-10 13:26:48'),('min_shares_required','5','Minimum shares required for membership (used to compute member share lien)',NULL,'2026-08-10 13:26:49'),('penalty_rate_default','2.0','Default penalty rate for overdue loans (%)',NULL,'2026-08-10 13:26:48'),('share_price','300','Share price in ETB (used to compute member share lien)',NULL,'2026-08-10 13:26:49');
/*!40000 ALTER TABLE `system_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_jobs`
--

DROP TABLE IF EXISTS `system_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_jobs` (
  `job_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_type` enum('EOD','EOM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('RUNNING','COMPLETED','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `performed_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `summary` json DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`job_id`),
  KEY `idx_job_type_created` (`job_type`,`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_jobs`
--

LOCK TABLES `system_jobs` WRITE;
/*!40000 ALTER TABLE `system_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `txn_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `txn_type` enum('DEPOSIT','WITHDRAWAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `balance_after` decimal(18,2) NOT NULL,
  `reference` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idempotency_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`txn_id`),
  KEY `fk_transaction_user` (`performed_by`),
  KEY `idx_transactions_account` (`account_id`),
  KEY `idx_transactions_idempotency` (`idempotency_key`),
  CONSTRAINT `fk_transaction_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`),
  CONSTRAINT `fk_transaction_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','TELLER','CREDIT_OFFICER','MANAGER','AUDITOR') COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','DISABLED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `password_changed_at` datetime DEFAULT NULL,
  `force_password_reset` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('4c67a09a-a986-46f3-997d-50fc3595708d','admin_1786368586309','$2b$12$MhApOjueiwTnRIKiC8eFWuiW4Uex/vOLiD7XAjIZn.TlHtRYng/y2','ADMIN','admin_1786368586309@sacco.local','+251900000000','ACTIVE',NULL,0,'2026-08-10 13:29:46','2026-08-10 13:29:46');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'alef_delta_sacco'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-10 20:44:34
