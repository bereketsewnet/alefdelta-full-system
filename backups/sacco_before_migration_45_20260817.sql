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
  `financial_category` enum('COMPULSORY_SAVINGS','VOLUNTARY_SAVINGS','SHARE_CAPITAL','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OTHER',
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
INSERT INTO `account_products` VALUES ('SAV_CHILD','Children\'s Savings','CHILD','Guardian-managed savings for minors','FAMILY','OTHER','STANDARD',1,0,1,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-11 10:44:33',1,0,NULL,1,100.00,0,'{\"notes\": \"Guardian approval required for withdrawals\"}'),('SAV_COMPULSORY','Savings - Compulsory','STANDARD','Compulsory savings account for all members','SAVINGS','COMPULSORY_SAVINGS','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'PROFIT_SHARING',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-17 22:10:51',0,0,NULL,1,0.00,0,NULL),('SAV_FIXED','Savings - Fixed','STANDARD','Fixed deposit account','SAVINGS','OTHER','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-10 13:26:46',0,0,NULL,1,0.00,0,NULL),('SAV_IN_KIND','In-Kind Savings','IN_KIND','Commodity-based savings converted on demand','IN_KIND','OTHER','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-10 13:26:46',0,1,'kg or units',0,0.00,0,'{\"notes\": \"Record commodity type and storage location\"}'),('SAV_MICRO','Micro Savings','MICRO','Low-balance, high-frequency savings product','MICRO','OTHER','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-10 13:26:46',0,0,NULL,1,50.00,0,'{\"notes\": \"Ideal for daily micro-deposits\"}'),('SAV_VOLUNTARY','Savings - Voluntary','STANDARD','Voluntary savings account','SAVINGS','VOLUNTARY_SAVINGS','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-17 14:26:38',0,0,NULL,1,0.00,0,NULL),('SHR_CAP','Share Capital','STANDARD','Share capital account','SHARES','SHARE_CAPITAL','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-08-10 13:26:46','2026-08-17 14:26:38',0,0,NULL,1,0.00,0,NULL);
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
INSERT INTO `accounts` VALUES ('5a365cee-79e8-4dc0-a7a0-78b246d2e3fc','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','SAV_CHILD',0.00,0.00,'ETB','STANDARD','{\"micro\": {\"target_date\": \"2026-08-11\", \"target_amount\": 5000}, \"guardian\": {\"name\": \"ato abebe\", \"phone\": \"+251965500612\", \"relationship\": \"father\"}}','ACTIVE',1,'2026-08-11 10:53:57','2026-08-11 10:53:57',NULL,0.00,NULL,NULL),('acc-1111-aaaa-bbbb-ccccdddd0001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','SAV_COMPULSORY',15052.43,0.00,'ETB','PROFIT_SHARING',NULL,'ACTIVE',2,'2026-08-10 20:44:35','2026-08-17 22:14:29',NULL,0.00,NULL,NULL),('acc-1111-aaaa-bbbb-ccccdddd0002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','SHR_CAP',5000.00,0.00,'ETB','STANDARD',NULL,'ACTIVE',1,'2026-08-10 20:44:35','2026-08-10 20:44:35',NULL,0.00,NULL,NULL),('acc-2222-aaaa-bbbb-ccccdddd0001','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','SAV_COMPULSORY',20004.57,0.00,'ETB','PROFIT_SHARING',NULL,'ACTIVE',2,'2026-08-10 20:44:35','2026-08-17 22:14:29',NULL,0.00,NULL,NULL),('acc-2222-aaaa-bbbb-ccccdddd0002','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','SAV_VOLUNTARY',10000.00,0.00,'ETB','STANDARD',NULL,'ACTIVE',1,'2026-08-10 20:44:35','2026-08-10 20:44:35',NULL,0.00,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'3cf744df-e02e-4d74-813c-9ac4f8561bc3','LOAN_APPROVAL_VOTE','loan_applications','2c8f5b2c-d710-4d27-8c4b-92ca33e58631','null','null','{\"votes\": [{\"reason\": \"E2E_TEST_20260811 approved\", \"decision\": \"APPROVED\", \"username\": \"e2e_manager\", \"voter_id\": \"3cf744df-e02e-4d74-813c-9ac4f8561bc3\", \"decided_at\": \"2026-08-11 18:02:54\", \"voter_role\": \"MANAGER\"}, {\"reason\": null, \"decision\": \"PENDING\", \"username\": \"e2e_board1\", \"voter_id\": \"60291a7a-861e-4e70-85ec-393b35dbc514\", \"decided_at\": null, \"voter_role\": \"BOARD_MEMBER\"}, {\"reason\": null, \"decision\": \"PENDING\", \"username\": \"e2e_board2\", \"voter_id\": \"f958daf4-e8a7-4d6e-8a32-b7a3d768ce98\", \"decided_at\": null, \"voter_role\": \"BOARD_MEMBER\"}], \"rejected\": null, \"board_approved\": 0, \"board_required\": 2, \"manager_approved\": true}','2026-08-11 18:02:54'),(2,'60291a7a-861e-4e70-85ec-393b35dbc514','LOAN_APPROVAL_VOTE','loan_applications','2c8f5b2c-d710-4d27-8c4b-92ca33e58631','null','null','{\"votes\": [{\"reason\": \"E2E_TEST_20260811 approved\", \"decision\": \"APPROVED\", \"username\": \"e2e_manager\", \"voter_id\": \"3cf744df-e02e-4d74-813c-9ac4f8561bc3\", \"decided_at\": \"2026-08-11 18:02:54\", \"voter_role\": \"MANAGER\"}, {\"reason\": \"E2E_TEST_20260811 approved\", \"decision\": \"APPROVED\", \"username\": \"e2e_board1\", \"voter_id\": \"60291a7a-861e-4e70-85ec-393b35dbc514\", \"decided_at\": \"2026-08-11 18:02:54\", \"voter_role\": \"BOARD_MEMBER\"}, {\"reason\": null, \"decision\": \"PENDING\", \"username\": \"e2e_board2\", \"voter_id\": \"f958daf4-e8a7-4d6e-8a32-b7a3d768ce98\", \"decided_at\": null, \"voter_role\": \"BOARD_MEMBER\"}], \"rejected\": null, \"board_approved\": 1, \"board_required\": 2, \"manager_approved\": true}','2026-08-11 18:02:54'),(3,'f958daf4-e8a7-4d6e-8a32-b7a3d768ce98','APPROVE_LOAN','loan_applications','2c8f5b2c-d710-4d27-8c4b-92ca33e58631','null','null','{\"audit_note\": \"E2E_TEST_20260811 approved\", \"term_months\": 12, \"interest_rate\": 12.5, \"approved_amount\": 10000}','2026-08-11 18:02:54'),(4,'60291a7a-861e-4e70-85ec-393b35dbc514','UPDATE_LOAN_STATUS','loan_applications','a63fb754-0643-40cb-bf02-bca5ff1ead6c','null','null','{\"status\": \"REJECTED\", \"previous_status\": \"UNDER_REVIEW\"}','2026-08-11 18:03:05'),(5,'33333333-3333-3333-3333-333333333333','CREATE_LOAN','loan_applications','3908c965-210b-41ed-af3b-966bf3249335','null','null','{\"evaluation_id\": \"0cf5a939-344c-402c-ab02-c50c031ef47b\", \"failed_checks\": [], \"exception_reason\": null}','2026-08-17 14:55:15'),(6,'33333333-3333-3333-3333-333333333333','CREATE_LOAN_EXCEPTION','loan_applications','02f8ac3d-0464-4ceb-be98-355b945c2bc3','null','null','{\"evaluation_id\": \"5fa9265f-91ca-458b-8f16-c25a67b459af\", \"failed_checks\": [\"affordability\", \"share_balance\"], \"exception_reason\": \"for test alkdjf\"}','2026-08-17 14:56:19'),(7,'44444444-4444-4444-4444-444444444444','LOAN_APPROVAL_VOTE','loan_applications','02f8ac3d-0464-4ceb-be98-355b945c2bc3','null','null','{\"votes\": [{\"reason\": \"kjasldkfjasdfasdfasdf\", \"decision\": \"APPROVED\", \"username\": \"manager\", \"voter_id\": \"44444444-4444-4444-4444-444444444444\", \"decided_at\": \"2026-08-17 14:57:23\", \"voter_role\": \"MANAGER\", \"override_reason\": \"this is for exptional\", \"override_acknowledged\": true, \"eligibility_evaluation_id\": \"5fa9265f-91ca-458b-8f16-c25a67b459af\"}, {\"reason\": null, \"decision\": \"PENDING\", \"username\": \"e2e_board1\", \"voter_id\": \"60291a7a-861e-4e70-85ec-393b35dbc514\", \"decided_at\": null, \"voter_role\": \"BOARD_MEMBER\", \"override_reason\": null, \"override_acknowledged\": false, \"eligibility_evaluation_id\": null}, {\"reason\": null, \"decision\": \"PENDING\", \"username\": \"e2e_board2\", \"voter_id\": \"f958daf4-e8a7-4d6e-8a32-b7a3d768ce98\", \"decided_at\": null, \"voter_role\": \"BOARD_MEMBER\", \"override_reason\": null, \"override_acknowledged\": false, \"eligibility_evaluation_id\": null}], \"rejected\": null, \"board_approved\": 0, \"board_required\": 2, \"manager_approved\": true}','2026-08-17 14:57:23'),(8,'60291a7a-861e-4e70-85ec-393b35dbc514','LOAN_APPROVAL_VOTE','loan_applications','02f8ac3d-0464-4ceb-be98-355b945c2bc3','null','null','{\"votes\": [{\"reason\": \"kjasldkfjasdfasdfasdf\", \"decision\": \"APPROVED\", \"username\": \"manager\", \"voter_id\": \"44444444-4444-4444-4444-444444444444\", \"decided_at\": \"2026-08-17 14:57:23\", \"voter_role\": \"MANAGER\", \"override_reason\": \"this is for exptional\", \"override_acknowledged\": true, \"eligibility_evaluation_id\": \"5fa9265f-91ca-458b-8f16-c25a67b459af\"}, {\"reason\": \"sdfgsdfgsdfgdsfg\", \"decision\": \"APPROVED\", \"username\": \"e2e_board1\", \"voter_id\": \"60291a7a-861e-4e70-85ec-393b35dbc514\", \"decided_at\": \"2026-08-17 14:57:58\", \"voter_role\": \"BOARD_MEMBER\", \"override_reason\": \"sdfgsdfgsdfg\", \"override_acknowledged\": true, \"eligibility_evaluation_id\": \"5fa9265f-91ca-458b-8f16-c25a67b459af\"}, {\"reason\": null, \"decision\": \"PENDING\", \"username\": \"e2e_board2\", \"voter_id\": \"f958daf4-e8a7-4d6e-8a32-b7a3d768ce98\", \"decided_at\": null, \"voter_role\": \"BOARD_MEMBER\", \"override_reason\": null, \"override_acknowledged\": false, \"eligibility_evaluation_id\": null}], \"rejected\": null, \"board_approved\": 1, \"board_required\": 2, \"manager_approved\": true}','2026-08-17 14:57:58'),(9,'11111111-1111-1111-1111-111111111111','MASTER_LEDGER_MANUAL_ADJUSTMENT','sacco_master_ledger','ef1ea05f-3089-46bf-8a9f-6ef53253d776','null','null','{\"amount\": \"100.00\", \"direction\": \"INFLOW\", \"description\": \"Development verification revenue for profit distribution\", \"affects_profit\": true}','2026-08-17 22:14:29'),(10,'11111111-1111-1111-1111-111111111111','GENERATE_PROFIT_DISTRIBUTION','profit_distributions','a70d8219-1b05-42a6-85e9-9f060acfb3d3','null','null','{\"net_profit\": \"100.00\", \"period_end\": \"2026-08-17\", \"period_start\": \"2026-08-17\"}','2026-08-17 22:14:29'),(11,'11111111-1111-1111-1111-111111111111','OVERRIDE_DISTRIBUTION_SHARE_UNITS','profit_distribution_member_allocations','ae3c788b-e6b6-4129-8c48-07a059652135','{\"share_units\": 16}','{\"share_units\": 16}','{\"reason\": \"Verified full paid shares against the development ledger\", \"distribution_id\": \"a70d8219-1b05-42a6-85e9-9f060acfb3d3\"}','2026-08-17 22:14:29'),(12,'11111111-1111-1111-1111-111111111111','SUBMIT_PROFIT_DISTRIBUTION','profit_distributions','a70d8219-1b05-42a6-85e9-9f060acfb3d3','null','null','{\"quorum\": 2, \"board_members\": 2}','2026-08-17 22:14:29'),(13,'60291a7a-861e-4e70-85ec-393b35dbc514','PROFIT_DISTRIBUTION_BOARD_VOTE','profit_distributions','a70d8219-1b05-42a6-85e9-9f060acfb3d3','null','null','{\"reason\": \"Reviewed and approved development distribution\", \"decision\": \"APPROVED\"}','2026-08-17 22:14:29'),(14,'f958daf4-e8a7-4d6e-8a32-b7a3d768ce98','PROFIT_DISTRIBUTION_BOARD_VOTE','profit_distributions','a70d8219-1b05-42a6-85e9-9f060acfb3d3','null','null','{\"reason\": \"Reviewed and approved development distribution\", \"decision\": \"APPROVED\"}','2026-08-17 22:14:29'),(15,'11111111-1111-1111-1111-111111111111','PAYOUT_PROFIT_DISTRIBUTION','profit_distributions','a70d8219-1b05-42a6-85e9-9f060acfb3d3','null','null','{\"amount\": \"57.00\", \"ledger_id\": \"54298cb6-4f1c-4553-b80b-98af8539b60b\", \"member_count\": 2}','2026-08-17 22:14:29'),(16,'11111111-1111-1111-1111-111111111111','MASTER_LEDGER_MANUAL_ADJUSTMENT','sacco_master_ledger','298cae15-a9ba-4e12-bca4-12821f2f6485','null','null','{\"amount\": \"5\", \"direction\": \"OUTFLOW\", \"description\": \"ggdsgdgdfgdfgdf\", \"affects_profit\": true, \"classification\": \"MANUAL_EXPENSE\"}','2026-08-17 23:00:22');
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
-- Table structure for table `loan_amortization_schedule`
--

DROP TABLE IF EXISTS `loan_amortization_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_amortization_schedule` (
  `loan_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `installment_no` int NOT NULL,
  `due_date` date NOT NULL,
  `opening_balance` decimal(18,2) NOT NULL,
  `scheduled_payment` decimal(18,2) NOT NULL,
  `scheduled_principal` decimal(18,2) NOT NULL,
  `scheduled_interest` decimal(18,2) NOT NULL,
  `closing_balance` decimal(18,2) NOT NULL,
  `principal_paid` decimal(18,2) NOT NULL DEFAULT '0.00',
  `interest_paid` decimal(18,2) NOT NULL DEFAULT '0.00',
  `status` enum('PENDING','PARTIAL','PAID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paid_at` date DEFAULT NULL,
  PRIMARY KEY (`loan_id`,`installment_no`),
  KEY `idx_schedule_due` (`loan_id`,`due_date`,`status`),
  CONSTRAINT `fk_schedule_loan` FOREIGN KEY (`loan_id`) REFERENCES `loan_applications` (`loan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_amortization_schedule`
--

LOCK TABLES `loan_amortization_schedule` WRITE;
/*!40000 ALTER TABLE `loan_amortization_schedule` DISABLE KEYS */;
INSERT INTO `loan_amortization_schedule` VALUES ('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',1,'2026-09-11',10000.00,890.83,786.66,104.17,9213.34,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',2,'2026-10-11',9213.34,890.83,794.86,95.97,8418.48,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',3,'2026-11-11',8418.48,890.83,803.14,87.69,7615.34,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',4,'2026-12-11',7615.34,890.83,811.50,79.33,6803.84,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',5,'2027-01-11',6803.84,890.83,819.96,70.87,5983.88,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',6,'2027-02-11',5983.88,890.83,828.50,62.33,5155.38,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',7,'2027-03-11',5155.38,890.83,837.13,53.70,4318.25,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',8,'2027-04-11',4318.25,890.83,845.85,44.98,3472.40,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',9,'2027-05-11',3472.40,890.83,854.66,36.17,2617.74,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',10,'2027-06-11',2617.74,890.83,863.56,27.27,1754.18,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',11,'2027-07-11',1754.18,890.83,872.56,18.27,881.62,0.00,0.00,'PENDING',NULL),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631',12,'2027-08-11',881.62,890.80,881.62,9.18,0.00,0.00,0.00,'PENDING',NULL);
/*!40000 ALTER TABLE `loan_amortization_schedule` ENABLE KEYS */;
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
  `selected_tier_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applied_amount` decimal(18,2) NOT NULL,
  `approved_amount` decimal(18,2) DEFAULT NULL,
  `outstanding_balance` decimal(18,2) DEFAULT NULL,
  `total_paid` decimal(18,2) DEFAULT '0.00',
  `total_penalty` decimal(18,2) DEFAULT '0.00',
  `penalty_due` decimal(18,2) NOT NULL DEFAULT '0.00',
  `term_months` int NOT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `interest_type` enum('FLAT','DECLINING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `penalty_rate` decimal(5,2) NOT NULL DEFAULT '2.00',
  `penalty_mode` enum('PERCENT','FIXED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERCENT',
  `penalty_fixed_amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `penalty_grace_days` int NOT NULL DEFAULT '0',
  `penalty_escalation_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `penalty_escalation_value` decimal(18,2) NOT NULL DEFAULT '0.00',
  `service_charge_mode` enum('PERCENT','FIXED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERCENT',
  `service_charge_rate` decimal(10,2) NOT NULL DEFAULT '0.00',
  `service_charge_fixed_amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `service_charge_amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `borrower_age` int DEFAULT NULL,
  `insurance_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `insurance_ceiling_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `insurance_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `insurance_premium` decimal(18,2) NOT NULL DEFAULT '0.00',
  `insurance_renewal_date` date DEFAULT NULL,
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
  `tier_policy_snapshot` json DEFAULT NULL,
  `eligibility_checked_at` datetime DEFAULT NULL,
  `latest_eligibility_evaluation_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `eligibility_exception_required` tinyint(1) NOT NULL DEFAULT '0',
  `officer_exception_reason` text COLLATE utf8mb4_unicode_ci,
  `created_by_user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`loan_id`),
  KEY `fk_loan_product` (`product_code`),
  KEY `idx_loans_member` (`member_id`),
  KEY `idx_loans_next_payment` (`next_payment_date`),
  KEY `idx_loan_selected_tier` (`selected_tier_id`),
  KEY `fk_loan_created_by` (`created_by_user_id`),
  KEY `fk_loan_latest_eligibility` (`latest_eligibility_evaluation_id`),
  CONSTRAINT `fk_loan_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_loan_latest_eligibility` FOREIGN KEY (`latest_eligibility_evaluation_id`) REFERENCES `loan_eligibility_evaluations` (`evaluation_id`),
  CONSTRAINT `fk_loan_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  CONSTRAINT `fk_loan_product` FOREIGN KEY (`product_code`) REFERENCES `loan_products` (`product_code`),
  CONSTRAINT `fk_loan_selected_tier` FOREIGN KEY (`selected_tier_id`) REFERENCES `loan_product_tiers` (`tier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_applications`
--

LOCK TABLES `loan_applications` WRITE;
/*!40000 ALTER TABLE `loan_applications` DISABLE KEYS */;
INSERT INTO `loan_applications` VALUES ('02f8ac3d-0464-4ceb-be98-355b945c2bc3','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','DEV_GROWTH','a883b71d-9a47-11f1-99e6-7e0b432c7d55',5000000.00,NULL,NULL,0.00,0.00,0.00,48,16.00,'DECLINING',2.00,'PERCENT',0.00,3,1,2.00,'PERCENT',0.00,0.00,0.00,44,1,2.30,2.30,115000.00,'2027-08-17','fhgfyfhjhgfhgfghfhffhhfgfg','MONTHLY','UNDER_REVIEW',NULL,NULL,NULL,NULL,0,0,'{\"checks\": [{\"data\": {\"actual\": \"ACTIVE\", \"required\": \"ACTIVE\"}, \"name\": \"status\", \"pass\": true, \"message\": \"Member status is ACTIVE.\", \"overrideable\": true}, {\"data\": {\"monthly_income\": 35000}, \"name\": \"income\", \"pass\": true, \"message\": \"Member has a recorded monthly income.\", \"overrideable\": true}, {\"data\": {\"termMonths\": 48, \"installment\": 141701.4, \"interestRate\": 16, \"appliedAmount\": 5000000, \"maxInstallment\": 11666.666666666666}, \"name\": \"affordability\", \"pass\": false, \"message\": \"Estimated installment ETB 141701.40 exceeds the allowed ETB 11666.67.\", \"overrideable\": true}, {\"data\": {\"required\": 0, \"months_saved\": 0}, \"name\": \"savings_duration\", \"pass\": true, \"message\": \"Savings account age is 0 months; 0 months required.\", \"overrideable\": true}, {\"data\": {\"floor\": 0, \"applied\": 5000000}, \"name\": \"loan_floor\", \"pass\": true, \"message\": \"Requested amount satisfies the tier minimum.\", \"overrideable\": true}, {\"data\": {\"actual\": 48, \"maximum\": 48, \"minimum\": 12}, \"name\": \"loan_term\", \"pass\": true, \"message\": \"Requested term is within the selected tier.\", \"overrideable\": true}, {\"data\": {\"pct\": 0, \"deficit\": 0, \"savings_balance\": 15000, \"required_balance\": 0, \"eligible_product_codes\": [\"SAV_COMPULSORY\"]}, \"name\": \"pre_savings\", \"pass\": true, \"message\": \"Required compulsory savings balance is satisfied.\", \"overrideable\": true}, {\"data\": {\"pct\": 5, \"deficit\": 245000, \"share_balance\": 5000, \"required_balance\": 250000}, \"name\": \"share_balance\", \"pass\": false, \"message\": \"Share Capital is short by ETB 245000.00.\", \"overrideable\": true}], \"passed\": false, \"breakdown\": {\"share_deficit\": 245000, \"savings_deficit\": 0, \"requested_amount\": 5000000, \"required_share_amount\": 250000, \"total_upfront_deficit\": 245000, \"savings_duration_months\": 0, \"eligible_savings_balance\": 15000, \"accumulated_share_balance\": 5000, \"eligible_savings_products\": [\"SAV_COMPULSORY\"], \"required_pre_savings_amount\": 0}, \"installment\": 141701.4, \"selected_tier\": {\"name\": \"Growth Loan Default Tier\", \"tier_id\": \"a883b71d-9a47-11f1-99e6-7e0b432c7d55\", \"is_active\": true, \"tier_code\": \"DEFAULT\", \"created_at\": \"2026-08-17 14:26:38\", \"updated_at\": \"2026-08-17 14:47:44\", \"product_code\": \"DEV_GROWTH\", \"display_order\": 1, \"interest_rate\": 16, \"max_term_months\": 48, \"loan_amount_max_etb\": null, \"loan_amount_min_etb\": 0, \"required_pre_savings_pct\": 0, \"eligible_savings_products\": [\"SAV_COMPULSORY\"], \"min_savings_duration_months\": 0, \"required_share_purchase_pct\": 5}, \"maxInstallment\": 11666.666666666666, \"override_required\": true}','{\"name\": \"Growth Loan Default Tier\", \"tier_id\": \"a883b71d-9a47-11f1-99e6-7e0b432c7d55\", \"is_active\": true, \"tier_code\": \"DEFAULT\", \"created_at\": \"2026-08-17 14:26:38\", \"updated_at\": \"2026-08-17 14:47:44\", \"product_code\": \"DEV_GROWTH\", \"display_order\": 1, \"interest_rate\": 16, \"max_term_months\": 48, \"loan_amount_max_etb\": null, \"loan_amount_min_etb\": 0, \"required_pre_savings_pct\": 0, \"eligible_savings_products\": [\"SAV_COMPULSORY\"], \"min_savings_duration_months\": 0, \"required_share_purchase_pct\": 5}','2026-08-17 14:56:19','5fa9265f-91ca-458b-8f16-c25a67b459af',1,'for test alkdjf','33333333-3333-3333-3333-333333333333','2026-08-17 14:56:19','2026-08-17 14:56:19'),('2c8f5b2c-d710-4d27-8c4b-92ca33e58631','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','L-EDU','a883bd77-9a47-11f1-99e6-7e0b432c7d55',10000.00,10000.00,10000.00,0.00,0.00,0.00,12,12.50,'DECLINING',2.00,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,0.00,NULL,1,0.00,0.00,0.00,NULL,'E2E_TEST_20260811 board approval','MONTHLY','APPROVED','2026-08-11','2026-09-11',NULL,NULL,0,0,'{\"checks\": [{\"name\": \"status\", \"pass\": true}, {\"name\": \"income\", \"pass\": true}, {\"data\": {\"termMonths\": 12, \"installment\": 890.83, \"interestRate\": 12.5, \"appliedAmount\": 10000, \"maxInstallment\": 11666.666666666666}, \"name\": \"affordability\", \"pass\": true}], \"passed\": true, \"installment\": 890.83, \"maxInstallment\": 11666.666666666666}',NULL,NULL,NULL,0,NULL,NULL,'2026-08-11 18:02:43','2026-08-17 14:26:38'),('3908c965-210b-41ed-af3b-966bf3249335','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','DEV_GROWTH','a883b71d-9a47-11f1-99e6-7e0b432c7d55',10000.00,NULL,NULL,0.00,0.00,0.00,14,16.00,'DECLINING',2.00,'PERCENT',0.00,3,1,2.00,'PERCENT',0.00,0.00,0.00,26,1,2.30,2.30,230.00,'2027-08-17','gjgjgjhgjhgjgjjhg','MONTHLY','UNDER_REVIEW',NULL,NULL,NULL,NULL,0,0,'{\"checks\": [{\"data\": {\"actual\": \"ACTIVE\", \"required\": \"ACTIVE\"}, \"name\": \"status\", \"pass\": true, \"message\": \"Member status is ACTIVE.\", \"overrideable\": true}, {\"data\": {\"monthly_income\": 35000}, \"name\": \"income\", \"pass\": true, \"message\": \"Member has a recorded monthly income.\", \"overrideable\": true}, {\"data\": {\"termMonths\": 14, \"installment\": 787.76, \"interestRate\": 16, \"appliedAmount\": 10000, \"maxInstallment\": 11666.666666666666}, \"name\": \"affordability\", \"pass\": true, \"message\": \"Estimated installment satisfies the affordability rule.\", \"overrideable\": true}, {\"data\": {\"required\": 0, \"months_saved\": 0}, \"name\": \"savings_duration\", \"pass\": true, \"message\": \"Savings account age is 0 months; 0 months required.\", \"overrideable\": true}, {\"data\": {\"floor\": 0, \"applied\": 10000}, \"name\": \"loan_floor\", \"pass\": true, \"message\": \"Requested amount satisfies the tier minimum.\", \"overrideable\": true}, {\"data\": {\"actual\": 14, \"maximum\": 48, \"minimum\": 12}, \"name\": \"loan_term\", \"pass\": true, \"message\": \"Requested term is within the selected tier.\", \"overrideable\": true}, {\"data\": {\"pct\": 0, \"deficit\": 0, \"savings_balance\": 15000, \"required_balance\": 0, \"eligible_product_codes\": [\"SAV_COMPULSORY\"]}, \"name\": \"pre_savings\", \"pass\": true, \"message\": \"Required compulsory savings balance is satisfied.\", \"overrideable\": true}, {\"data\": {\"pct\": 5, \"deficit\": 0, \"share_balance\": 5000, \"required_balance\": 500}, \"name\": \"share_balance\", \"pass\": true, \"message\": \"Required accumulated share balance is satisfied.\", \"overrideable\": true}], \"passed\": true, \"breakdown\": {\"share_deficit\": 0, \"savings_deficit\": 0, \"requested_amount\": 10000, \"required_share_amount\": 500, \"total_upfront_deficit\": 0, \"savings_duration_months\": 0, \"eligible_savings_balance\": 15000, \"accumulated_share_balance\": 5000, \"eligible_savings_products\": [\"SAV_COMPULSORY\"], \"required_pre_savings_amount\": 0}, \"installment\": 787.76, \"selected_tier\": {\"name\": \"Growth Loan Default Tier\", \"tier_id\": \"a883b71d-9a47-11f1-99e6-7e0b432c7d55\", \"is_active\": true, \"tier_code\": \"DEFAULT\", \"created_at\": \"2026-08-17 14:26:38\", \"updated_at\": \"2026-08-17 14:47:44\", \"product_code\": \"DEV_GROWTH\", \"display_order\": 1, \"interest_rate\": 16, \"max_term_months\": 48, \"loan_amount_max_etb\": null, \"loan_amount_min_etb\": 0, \"required_pre_savings_pct\": 0, \"eligible_savings_products\": [\"SAV_COMPULSORY\"], \"min_savings_duration_months\": 0, \"required_share_purchase_pct\": 5}, \"maxInstallment\": 11666.666666666666, \"override_required\": false}','{\"name\": \"Growth Loan Default Tier\", \"tier_id\": \"a883b71d-9a47-11f1-99e6-7e0b432c7d55\", \"is_active\": true, \"tier_code\": \"DEFAULT\", \"created_at\": \"2026-08-17 14:26:38\", \"updated_at\": \"2026-08-17 14:47:44\", \"product_code\": \"DEV_GROWTH\", \"display_order\": 1, \"interest_rate\": 16, \"max_term_months\": 48, \"loan_amount_max_etb\": null, \"loan_amount_min_etb\": 0, \"required_pre_savings_pct\": 0, \"eligible_savings_products\": [\"SAV_COMPULSORY\"], \"min_savings_duration_months\": 0, \"required_share_purchase_pct\": 5}','2026-08-17 14:55:15','0cf5a939-344c-402c-ab02-c50c031ef47b',0,NULL,'33333333-3333-3333-3333-333333333333','2026-08-17 14:55:15','2026-08-17 14:55:15'),('7d434eb4-3c59-4236-82ba-730c78617f67','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','L-HSE','a883be9b-9a47-11f1-99e6-7e0b432c7d55',10000.00,NULL,NULL,0.00,0.00,0.00,60,17.00,'DECLINING',2.50,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,0.00,46,1,2.85,2.85,285.00,'2027-08-12','E2E_TEST_20260812 insurance','MONTHLY','UNDER_REVIEW',NULL,NULL,NULL,NULL,0,0,'{\"checks\": [{\"name\": \"status\", \"pass\": true}, {\"name\": \"income\", \"pass\": true}, {\"data\": {\"termMonths\": 60, \"installment\": 248.53, \"interestRate\": 17, \"appliedAmount\": 10000, \"maxInstallment\": 11666.666666666666}, \"name\": \"affordability\", \"pass\": true}], \"passed\": true, \"installment\": 248.53, \"maxInstallment\": 11666.666666666666}',NULL,NULL,NULL,0,NULL,NULL,'2026-08-12 18:17:35','2026-08-17 14:26:38'),('a63fb754-0643-40cb-bf02-bca5ff1ead6c','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','L-EDU','a883bd77-9a47-11f1-99e6-7e0b432c7d55',10000.00,NULL,NULL,0.00,0.00,0.00,12,12.50,'DECLINING',2.00,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,0.00,NULL,1,0.00,0.00,0.00,NULL,'E2E_TEST_20260811 rejection','MONTHLY','REJECTED',NULL,NULL,NULL,NULL,0,0,'{\"checks\": [{\"name\": \"status\", \"pass\": true}, {\"name\": \"income\", \"pass\": true}, {\"data\": {\"termMonths\": 12, \"installment\": 890.83, \"interestRate\": 12.5, \"appliedAmount\": 10000, \"maxInstallment\": 11666.666666666666}, \"name\": \"affordability\", \"pass\": true}], \"passed\": true, \"installment\": 890.83, \"maxInstallment\": 11666.666666666666}',NULL,NULL,NULL,0,NULL,NULL,'2026-08-11 18:03:04','2026-08-17 14:26:38'),('d1592e84-6ddc-4883-930a-35721b6d3461','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','SAV_STANDARD','a883c89c-9a47-11f1-99e6-7e0b432c7d55',10000.00,NULL,NULL,0.00,0.00,0.00,23,12.50,'DECLINING',1.50,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,0.00,42,1,2.30,2.30,230.00,'2027-08-12','bbhgfhghghjhgjhhj','MONTHLY','UNDER_REVIEW',NULL,NULL,NULL,NULL,0,0,'{\"checks\": [{\"name\": \"status\", \"pass\": true}, {\"name\": \"income\", \"pass\": true}, {\"data\": {\"termMonths\": 23, \"installment\": 491.19, \"interestRate\": 12.5, \"appliedAmount\": 10000, \"maxInstallment\": 11666.666666666666}, \"name\": \"affordability\", \"pass\": true}], \"passed\": true, \"installment\": 491.19, \"maxInstallment\": 11666.666666666666}',NULL,NULL,NULL,0,NULL,NULL,'2026-08-12 20:44:54','2026-08-17 14:26:38');
/*!40000 ALTER TABLE `loan_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_approval_votes`
--

DROP TABLE IF EXISTS `loan_approval_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_approval_votes` (
  `vote_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `voter_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `voter_role` enum('MANAGER','ADMIN','BOARD_MEMBER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `decision` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `eligibility_evaluation_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `override_acknowledged` tinyint(1) NOT NULL DEFAULT '0',
  `override_reason` text COLLATE utf8mb4_unicode_ci,
  `decided_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vote_id`),
  UNIQUE KEY `uq_loan_voter` (`loan_id`,`voter_id`),
  KEY `fk_loan_vote_user` (`voter_id`),
  KEY `fk_vote_eligibility_evaluation` (`eligibility_evaluation_id`),
  CONSTRAINT `fk_loan_vote_loan` FOREIGN KEY (`loan_id`) REFERENCES `loan_applications` (`loan_id`),
  CONSTRAINT `fk_loan_vote_user` FOREIGN KEY (`voter_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_vote_eligibility_evaluation` FOREIGN KEY (`eligibility_evaluation_id`) REFERENCES `loan_eligibility_evaluations` (`evaluation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_approval_votes`
--

LOCK TABLES `loan_approval_votes` WRITE;
/*!40000 ALTER TABLE `loan_approval_votes` DISABLE KEYS */;
INSERT INTO `loan_approval_votes` VALUES ('17d57cad-967a-11f1-99e6-7e0b432c7d55','7d434eb4-3c59-4236-82ba-730c78617f67','60291a7a-861e-4e70-85ec-393b35dbc514','BOARD_MEMBER','PENDING',NULL,NULL,0,NULL,NULL,'2026-08-12 18:17:35'),('17d63d2a-967a-11f1-99e6-7e0b432c7d55','7d434eb4-3c59-4236-82ba-730c78617f67','f958daf4-e8a7-4d6e-8a32-b7a3d768ce98','BOARD_MEMBER','PENDING',NULL,NULL,0,NULL,NULL,'2026-08-12 18:17:35'),('a81189f9-9a4b-11f1-99e6-7e0b432c7d55','3908c965-210b-41ed-af3b-966bf3249335','60291a7a-861e-4e70-85ec-393b35dbc514','BOARD_MEMBER','PENDING',NULL,NULL,0,NULL,NULL,'2026-08-17 14:55:15'),('a811bd45-9a4b-11f1-99e6-7e0b432c7d55','3908c965-210b-41ed-af3b-966bf3249335','f958daf4-e8a7-4d6e-8a32-b7a3d768ce98','BOARD_MEMBER','PENDING',NULL,NULL,0,NULL,NULL,'2026-08-17 14:55:15'),('ac441a20-968e-11f1-99e6-7e0b432c7d55','d1592e84-6ddc-4883-930a-35721b6d3461','60291a7a-861e-4e70-85ec-393b35dbc514','BOARD_MEMBER','PENDING',NULL,NULL,0,NULL,NULL,'2026-08-12 20:44:54'),('ac4480b4-968e-11f1-99e6-7e0b432c7d55','d1592e84-6ddc-4883-930a-35721b6d3461','f958daf4-e8a7-4d6e-8a32-b7a3d768ce98','BOARD_MEMBER','PENDING',NULL,NULL,0,NULL,NULL,'2026-08-12 20:44:54'),('ce35ea48-9a4b-11f1-99e6-7e0b432c7d55','02f8ac3d-0464-4ceb-be98-355b945c2bc3','60291a7a-861e-4e70-85ec-393b35dbc514','BOARD_MEMBER','APPROVED','sdfgsdfgsdfgdsfg','5fa9265f-91ca-458b-8f16-c25a67b459af',1,'sdfgsdfgsdfg','2026-08-17 14:57:58','2026-08-17 14:56:19'),('ce36027d-9a4b-11f1-99e6-7e0b432c7d55','02f8ac3d-0464-4ceb-be98-355b945c2bc3','f958daf4-e8a7-4d6e-8a32-b7a3d768ce98','BOARD_MEMBER','PENDING',NULL,NULL,0,NULL,NULL,'2026-08-17 14:56:19'),('da0672e2-95ae-11f1-99e6-7e0b432c7d55','2c8f5b2c-d710-4d27-8c4b-92ca33e58631','60291a7a-861e-4e70-85ec-393b35dbc514','BOARD_MEMBER','APPROVED','E2E_TEST_20260811 approved',NULL,0,NULL,'2026-08-11 18:02:54','2026-08-11 18:02:43'),('da06d449-95ae-11f1-99e6-7e0b432c7d55','2c8f5b2c-d710-4d27-8c4b-92ca33e58631','f958daf4-e8a7-4d6e-8a32-b7a3d768ce98','BOARD_MEMBER','APPROVED','E2E_TEST_20260811 approved',NULL,0,NULL,'2026-08-11 18:02:54','2026-08-11 18:02:43'),('e0658149-95ae-11f1-99e6-7e0b432c7d55','2c8f5b2c-d710-4d27-8c4b-92ca33e58631','3cf744df-e02e-4d74-813c-9ac4f8561bc3','MANAGER','APPROVED','E2E_TEST_20260811 approved',NULL,0,NULL,'2026-08-11 18:02:54','2026-08-11 18:02:54'),('e685e408-95ae-11f1-99e6-7e0b432c7d55','a63fb754-0643-40cb-bf02-bca5ff1ead6c','60291a7a-861e-4e70-85ec-393b35dbc514','BOARD_MEMBER','REJECTED','E2E_TEST_20260811 required rejection reason',NULL,0,NULL,'2026-08-11 18:03:05','2026-08-11 18:03:04'),('e6869707-95ae-11f1-99e6-7e0b432c7d55','a63fb754-0643-40cb-bf02-bca5ff1ead6c','f958daf4-e8a7-4d6e-8a32-b7a3d768ce98','BOARD_MEMBER','PENDING',NULL,NULL,0,NULL,NULL,'2026-08-11 18:03:04'),('f4330a8d-9a4b-11f1-99e6-7e0b432c7d55','02f8ac3d-0464-4ceb-be98-355b945c2bc3','44444444-4444-4444-4444-444444444444','MANAGER','APPROVED','kjasldkfjasdfasdfasdf','5fa9265f-91ca-458b-8f16-c25a67b459af',1,'this is for exptional','2026-08-17 14:57:23','2026-08-17 14:57:23');
/*!40000 ALTER TABLE `loan_approval_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_eligibility_evaluations`
--

DROP TABLE IF EXISTS `loan_eligibility_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_eligibility_evaluations` (
  `evaluation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluation_source` enum('SUBMISSION','MANUAL_REFRESH') COLLATE utf8mb4_unicode_ci NOT NULL,
  `passed` tinyint(1) NOT NULL,
  `result_snapshot` json NOT NULL,
  `evaluated_by_user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`evaluation_id`),
  KEY `idx_loan_eligibility_loan` (`loan_id`,`created_at`),
  KEY `fk_eligibility_actor` (`evaluated_by_user_id`),
  CONSTRAINT `fk_eligibility_actor` FOREIGN KEY (`evaluated_by_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_eligibility_loan` FOREIGN KEY (`loan_id`) REFERENCES `loan_applications` (`loan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_eligibility_evaluations`
--

LOCK TABLES `loan_eligibility_evaluations` WRITE;
/*!40000 ALTER TABLE `loan_eligibility_evaluations` DISABLE KEYS */;
INSERT INTO `loan_eligibility_evaluations` VALUES ('0cf5a939-344c-402c-ab02-c50c031ef47b','3908c965-210b-41ed-af3b-966bf3249335','SUBMISSION',1,'{\"checks\": [{\"data\": {\"actual\": \"ACTIVE\", \"required\": \"ACTIVE\"}, \"name\": \"status\", \"pass\": true, \"message\": \"Member status is ACTIVE.\", \"overrideable\": true}, {\"data\": {\"monthly_income\": 35000}, \"name\": \"income\", \"pass\": true, \"message\": \"Member has a recorded monthly income.\", \"overrideable\": true}, {\"data\": {\"termMonths\": 14, \"installment\": 787.76, \"interestRate\": 16, \"appliedAmount\": 10000, \"maxInstallment\": 11666.666666666666}, \"name\": \"affordability\", \"pass\": true, \"message\": \"Estimated installment satisfies the affordability rule.\", \"overrideable\": true}, {\"data\": {\"required\": 0, \"months_saved\": 0}, \"name\": \"savings_duration\", \"pass\": true, \"message\": \"Savings account age is 0 months; 0 months required.\", \"overrideable\": true}, {\"data\": {\"floor\": 0, \"applied\": 10000}, \"name\": \"loan_floor\", \"pass\": true, \"message\": \"Requested amount satisfies the tier minimum.\", \"overrideable\": true}, {\"data\": {\"actual\": 14, \"maximum\": 48, \"minimum\": 12}, \"name\": \"loan_term\", \"pass\": true, \"message\": \"Requested term is within the selected tier.\", \"overrideable\": true}, {\"data\": {\"pct\": 0, \"deficit\": 0, \"savings_balance\": 15000, \"required_balance\": 0, \"eligible_product_codes\": [\"SAV_COMPULSORY\"]}, \"name\": \"pre_savings\", \"pass\": true, \"message\": \"Required compulsory savings balance is satisfied.\", \"overrideable\": true}, {\"data\": {\"pct\": 5, \"deficit\": 0, \"share_balance\": 5000, \"required_balance\": 500}, \"name\": \"share_balance\", \"pass\": true, \"message\": \"Required accumulated share balance is satisfied.\", \"overrideable\": true}], \"passed\": true, \"breakdown\": {\"share_deficit\": 0, \"savings_deficit\": 0, \"requested_amount\": 10000, \"required_share_amount\": 500, \"total_upfront_deficit\": 0, \"savings_duration_months\": 0, \"eligible_savings_balance\": 15000, \"accumulated_share_balance\": 5000, \"eligible_savings_products\": [\"SAV_COMPULSORY\"], \"required_pre_savings_amount\": 0}, \"installment\": 787.76, \"selected_tier\": {\"name\": \"Growth Loan Default Tier\", \"tier_id\": \"a883b71d-9a47-11f1-99e6-7e0b432c7d55\", \"is_active\": true, \"tier_code\": \"DEFAULT\", \"created_at\": \"2026-08-17 14:26:38\", \"updated_at\": \"2026-08-17 14:47:44\", \"product_code\": \"DEV_GROWTH\", \"display_order\": 1, \"interest_rate\": 16, \"max_term_months\": 48, \"loan_amount_max_etb\": null, \"loan_amount_min_etb\": 0, \"required_pre_savings_pct\": 0, \"eligible_savings_products\": [\"SAV_COMPULSORY\"], \"min_savings_duration_months\": 0, \"required_share_purchase_pct\": 5}, \"maxInstallment\": 11666.666666666666, \"override_required\": false}','33333333-3333-3333-3333-333333333333','2026-08-17 14:55:15'),('5fa9265f-91ca-458b-8f16-c25a67b459af','02f8ac3d-0464-4ceb-be98-355b945c2bc3','SUBMISSION',0,'{\"checks\": [{\"data\": {\"actual\": \"ACTIVE\", \"required\": \"ACTIVE\"}, \"name\": \"status\", \"pass\": true, \"message\": \"Member status is ACTIVE.\", \"overrideable\": true}, {\"data\": {\"monthly_income\": 35000}, \"name\": \"income\", \"pass\": true, \"message\": \"Member has a recorded monthly income.\", \"overrideable\": true}, {\"data\": {\"termMonths\": 48, \"installment\": 141701.4, \"interestRate\": 16, \"appliedAmount\": 5000000, \"maxInstallment\": 11666.666666666666}, \"name\": \"affordability\", \"pass\": false, \"message\": \"Estimated installment ETB 141701.40 exceeds the allowed ETB 11666.67.\", \"overrideable\": true}, {\"data\": {\"required\": 0, \"months_saved\": 0}, \"name\": \"savings_duration\", \"pass\": true, \"message\": \"Savings account age is 0 months; 0 months required.\", \"overrideable\": true}, {\"data\": {\"floor\": 0, \"applied\": 5000000}, \"name\": \"loan_floor\", \"pass\": true, \"message\": \"Requested amount satisfies the tier minimum.\", \"overrideable\": true}, {\"data\": {\"actual\": 48, \"maximum\": 48, \"minimum\": 12}, \"name\": \"loan_term\", \"pass\": true, \"message\": \"Requested term is within the selected tier.\", \"overrideable\": true}, {\"data\": {\"pct\": 0, \"deficit\": 0, \"savings_balance\": 15000, \"required_balance\": 0, \"eligible_product_codes\": [\"SAV_COMPULSORY\"]}, \"name\": \"pre_savings\", \"pass\": true, \"message\": \"Required compulsory savings balance is satisfied.\", \"overrideable\": true}, {\"data\": {\"pct\": 5, \"deficit\": 245000, \"share_balance\": 5000, \"required_balance\": 250000}, \"name\": \"share_balance\", \"pass\": false, \"message\": \"Share Capital is short by ETB 245000.00.\", \"overrideable\": true}], \"passed\": false, \"breakdown\": {\"share_deficit\": 245000, \"savings_deficit\": 0, \"requested_amount\": 5000000, \"required_share_amount\": 250000, \"total_upfront_deficit\": 245000, \"savings_duration_months\": 0, \"eligible_savings_balance\": 15000, \"accumulated_share_balance\": 5000, \"eligible_savings_products\": [\"SAV_COMPULSORY\"], \"required_pre_savings_amount\": 0}, \"installment\": 141701.4, \"selected_tier\": {\"name\": \"Growth Loan Default Tier\", \"tier_id\": \"a883b71d-9a47-11f1-99e6-7e0b432c7d55\", \"is_active\": true, \"tier_code\": \"DEFAULT\", \"created_at\": \"2026-08-17 14:26:38\", \"updated_at\": \"2026-08-17 14:47:44\", \"product_code\": \"DEV_GROWTH\", \"display_order\": 1, \"interest_rate\": 16, \"max_term_months\": 48, \"loan_amount_max_etb\": null, \"loan_amount_min_etb\": 0, \"required_pre_savings_pct\": 0, \"eligible_savings_products\": [\"SAV_COMPULSORY\"], \"min_savings_duration_months\": 0, \"required_share_purchase_pct\": 5}, \"maxInstallment\": 11666.666666666666, \"override_required\": true}','33333333-3333-3333-3333-333333333333','2026-08-17 14:56:19');
/*!40000 ALTER TABLE `loan_eligibility_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_insurance_rate_matrix`
--

DROP TABLE IF EXISTS `loan_insurance_rate_matrix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_insurance_rate_matrix` (
  `rate_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `age_min` int NOT NULL,
  `age_max` int DEFAULT NULL,
  `term_min_months` int NOT NULL,
  `term_max_months` int NOT NULL,
  `marital_status` enum('SINGLE','MARRIED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ceiling_rate` decimal(5,2) NOT NULL,
  `configured_rate` decimal(5,2) NOT NULL,
  `clause_reference` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`rate_id`),
  UNIQUE KEY `uq_insurance_matrix` (`age_min`,`age_max`,`term_min_months`,`term_max_months`,`marital_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_insurance_rate_matrix`
--

LOCK TABLES `loan_insurance_rate_matrix` WRITE;
/*!40000 ALTER TABLE `loan_insurance_rate_matrix` DISABLE KEYS */;
INSERT INTO `loan_insurance_rate_matrix` VALUES ('08576613-967e-11f1-99e6-7e0b432c7d55',18,45,1,12,'SINGLE',1.50,1.50,'2.5.3.1 ሀ'),('085768cf-967e-11f1-99e6-7e0b432c7d55',18,45,1,12,'MARRIED',1.95,1.95,'2.5.3.1 ሀ'),('085769df-967e-11f1-99e6-7e0b432c7d55',18,45,13,60,'SINGLE',1.75,1.75,'2.5.3.1 ለ'),('08576a5a-967e-11f1-99e6-7e0b432c7d55',18,45,13,60,'MARRIED',2.30,2.30,'2.5.3.1 ለ'),('08576ac8-967e-11f1-99e6-7e0b432c7d55',18,45,61,120,'SINGLE',2.05,2.05,'2.5.3.1 ሐ'),('08576b52-967e-11f1-99e6-7e0b432c7d55',18,45,61,120,'MARRIED',2.80,2.80,'2.5.3.1 ሐ'),('08576bb2-967e-11f1-99e6-7e0b432c7d55',46,60,1,12,'SINGLE',1.95,1.95,'2.5.3.1 መ'),('08576c16-967e-11f1-99e6-7e0b432c7d55',46,60,1,12,'MARRIED',2.55,2.55,'2.5.3.1 መ'),('08576c79-967e-11f1-99e6-7e0b432c7d55',46,60,13,60,'SINGLE',2.05,2.05,'2.5.3.1 ሠ'),('08576cd5-967e-11f1-99e6-7e0b432c7d55',46,60,13,60,'MARRIED',2.85,2.85,'2.5.3.1 ሠ'),('08576d35-967e-11f1-99e6-7e0b432c7d55',46,60,61,120,'SINGLE',2.50,2.50,'2.5.3.1 ረ'),('08576d92-967e-11f1-99e6-7e0b432c7d55',46,60,61,120,'MARRIED',3.30,3.30,'2.5.3.1 ረ'),('08576def-967e-11f1-99e6-7e0b432c7d55',61,NULL,1,12,'SINGLE',2.50,2.50,'2.5.3.1 ሰ'),('08576e56-967e-11f1-99e6-7e0b432c7d55',61,NULL,1,12,'MARRIED',3.30,3.30,'2.5.3.1 ሰ'),('08576eb8-967e-11f1-99e6-7e0b432c7d55',61,NULL,13,60,'SINGLE',2.60,2.60,'2.5.3.1 ሸ'),('08576f17-967e-11f1-99e6-7e0b432c7d55',61,NULL,13,60,'MARRIED',3.50,3.50,'2.5.3.1 ሸ'),('08576f75-967e-11f1-99e6-7e0b432c7d55',61,NULL,61,120,'SINGLE',2.80,2.80,'2.5.3.1 ቀ'),('08577443-967e-11f1-99e6-7e0b432c7d55',61,NULL,61,120,'MARRIED',3.80,3.80,'2.5.3.1 ቀ');
/*!40000 ALTER TABLE `loan_insurance_rate_matrix` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_penalty_adjustments`
--

DROP TABLE IF EXISTS `loan_penalty_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_penalty_adjustments` (
  `adjustment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `adjusted_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`adjustment_id`),
  KEY `fk_penalty_adjustment_loan` (`loan_id`),
  KEY `fk_penalty_adjustment_user` (`adjusted_by`),
  CONSTRAINT `fk_penalty_adjustment_loan` FOREIGN KEY (`loan_id`) REFERENCES `loan_applications` (`loan_id`),
  CONSTRAINT `fk_penalty_adjustment_user` FOREIGN KEY (`adjusted_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_penalty_adjustments`
--

LOCK TABLES `loan_penalty_adjustments` WRITE;
/*!40000 ALTER TABLE `loan_penalty_adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `loan_penalty_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_product_tiers`
--

DROP TABLE IF EXISTS `loan_product_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_product_tiers` (
  `tier_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tier_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `min_savings_duration_months` int NOT NULL DEFAULT '0',
  `loan_amount_min_etb` decimal(18,2) NOT NULL DEFAULT '0.00',
  `loan_amount_max_etb` decimal(18,2) DEFAULT NULL,
  `max_term_months` int NOT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `required_pre_savings_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `required_share_purchase_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tier_id`),
  UNIQUE KEY `uq_loan_product_tier_code` (`product_code`,`tier_code`),
  KEY `idx_loan_product_tiers_product` (`product_code`,`is_active`,`display_order`),
  CONSTRAINT `fk_loan_tier_product` FOREIGN KEY (`product_code`) REFERENCES `loan_products` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_product_tiers`
--

LOCK TABLES `loan_product_tiers` WRITE;
/*!40000 ALTER TABLE `loan_product_tiers` DISABLE KEYS */;
INSERT INTO `loan_product_tiers` VALUES ('41000000-0000-4000-8000-000000000001','TIER-1','STD-01','Standard Tier 1',1,3,0.00,100000.00,24,14.00,10.00,10.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('41000000-0000-4000-8000-000000000002','TIER-1','STD-02','Standard Tier 2',2,4,100001.00,200000.00,48,15.50,10.00,10.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('41000000-0000-4000-8000-000000000003','TIER-1','STD-03','Standard Tier 3',3,5,200001.00,400000.00,48,15.50,10.00,10.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('41000000-0000-4000-8000-000000000004','TIER-1','STD-04','Standard Tier 4',4,6,400001.00,1000000.00,48,15.50,20.00,10.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('41000000-0000-4000-8000-000000000005','TIER-1','STD-05','Standard Tier 5',5,7,1000001.00,1500000.00,60,16.50,20.00,10.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('41000000-0000-4000-8000-000000000006','TIER-1','STD-06','Standard Tier 6',6,8,1500001.00,2500000.00,60,16.50,30.00,10.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('41000000-0000-4000-8000-000000000007','TIER-1','STD-07','Standard Tier 7',7,9,2500001.00,3500000.00,60,16.50,30.00,10.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('41000000-0000-4000-8000-000000000008','TIER-1','STD-08','Standard Tier 8',8,10,3500001.00,7000000.00,96,17.00,35.00,15.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('41000000-0000-4000-8000-000000000009','TIER-9','VEH-01','Vehicle Purchase Tier',1,3,0.00,3500000.00,60,16.50,50.00,10.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('41000000-0000-4000-8000-000000000010','TIER-10','HOU-01','House Purchase Tier',1,4,0.00,7000000.00,96,17.00,45.00,15.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('4f0371fc-cc45-46d6-ae71-1f11e328e17e','DEV_GROWTH','TIER-2','Tier 2',2,0,0.00,NULL,24,0.00,0.00,0.00,1,'2026-08-17 14:44:35','2026-08-17 14:44:35'),('a883b71d-9a47-11f1-99e6-7e0b432c7d55','DEV_GROWTH','DEFAULT','Growth Loan Default Tier',1,0,0.00,NULL,48,16.00,0.00,5.00,1,'2026-08-17 14:26:38','2026-08-17 14:47:44'),('a883b99f-9a47-11f1-99e6-7e0b432c7d55','L-AGR','DEFAULT','Urban Agriculture Default Tier',1,0,0.00,NULL,60,14.00,0.00,0.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('a883bbc1-9a47-11f1-99e6-7e0b432c7d55','L-BIZ','DEFAULT','Business Expansion Default Tier',1,0,0.00,NULL,60,14.00,0.00,0.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('a883bd77-9a47-11f1-99e6-7e0b432c7d55','L-EDU','DEFAULT','Education Loan Default Tier',1,0,0.00,NULL,24,12.50,0.00,0.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('a883be9b-9a47-11f1-99e6-7e0b432c7d55','L-HSE','DEFAULT','Home Construction Default Tier',1,0,0.00,NULL,120,17.00,0.00,0.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('a883bfdd-9a47-11f1-99e6-7e0b432c7d55','L-INS','DEFAULT','Insurance Loan Default Tier',1,0,0.00,NULL,12,12.50,0.00,0.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('a883c09d-9a47-11f1-99e6-7e0b432c7d55','L-MED','DEFAULT','Medical Loan Default Tier',1,0,0.00,NULL,24,12.50,0.00,0.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('a883c156-9a47-11f1-99e6-7e0b432c7d55','L-SOC','DEFAULT','Social Event Loan Default Tier',1,0,0.00,NULL,24,12.50,0.00,0.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('a883c68f-9a47-11f1-99e6-7e0b432c7d55','L-VEH','DEFAULT','Vehicle Purchase Default Tier',1,0,0.00,NULL,60,14.00,0.00,0.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38'),('a883c89c-9a47-11f1-99e6-7e0b432c7d55','SAV_STANDARD','DEFAULT','Standard Loan Default Tier',1,0,0.00,NULL,36,12.50,0.00,0.00,1,'2026-08-17 14:26:38','2026-08-17 14:26:38');
/*!40000 ALTER TABLE `loan_product_tiers` ENABLE KEYS */;
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
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `penalty_mode` enum('PERCENT','FIXED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERCENT',
  `penalty_fixed_amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `penalty_grace_days` int NOT NULL DEFAULT '0',
  `penalty_escalation_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `penalty_escalation_value` decimal(18,2) NOT NULL DEFAULT '0.00',
  `service_charge_mode` enum('PERCENT','FIXED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERCENT',
  `service_charge_rate` decimal(10,2) NOT NULL DEFAULT '0.00',
  `service_charge_fixed_amount` decimal(18,2) NOT NULL DEFAULT '0.00',
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
INSERT INTO `loan_products` VALUES ('DEV_GROWTH','Growth Loan',16.00,'DECLINING',12,48,2.00,1,'PERCENT',0.00,3,1,2.00,'PERCENT',0.00,0.00,'2026-08-10 20:44:35',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('L-AGR','Urban Agriculture',14.00,'DECLINING',12,60,2.00,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 20:44:35',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('L-BIZ','Business Expansion',14.00,'DECLINING',12,60,2.00,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 20:44:35',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('L-EDU','Education Loan',12.50,'DECLINING',6,24,2.00,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 20:44:35',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('L-HSE','Home Construction',17.00,'DECLINING',12,120,2.50,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 20:44:35',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('L-INS','Insurance Loan',12.50,'DECLINING',6,12,1.50,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 20:44:35',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('L-MED','Medical Loan',12.50,'DECLINING',6,24,2.00,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 20:44:35',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('L-SOC','Social Event Loan',12.50,'DECLINING',6,24,2.00,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 20:44:35',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('L-VEH','Vehicle Purchase',14.00,'DECLINING',12,60,2.00,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 20:44:35',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('SAV_STANDARD','Standard Loan',12.50,'DECLINING',6,36,1.50,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 20:44:35',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('TIER-1','Standard Policy Loan',14.00,'DECLINING',1,96,2.00,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 13:26:50',NULL,3,0.00,100000.00,10.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-10','House Purchase Loan',17.00,'DECLINING',1,96,2.00,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 13:26:50',NULL,4,0.00,7000000.00,45.00,15.00,1,'HOUSING','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-2','Standard Loan - Tier 2',15.50,'DECLINING',1,48,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 13:26:50',NULL,4,100001.00,200000.00,10.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-3','Standard Loan - Tier 3',15.50,'DECLINING',1,48,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 13:26:50',NULL,5,200001.00,400000.00,10.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-4','Standard Loan - Tier 4',15.50,'DECLINING',1,48,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 13:26:50',NULL,6,400001.00,1000000.00,20.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-5','Standard Loan - Tier 5',16.50,'DECLINING',1,60,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 13:26:50',NULL,7,1000001.00,1500000.00,20.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-6','Standard Loan - Tier 6',16.50,'DECLINING',1,60,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 13:26:50',NULL,8,1500001.00,2500000.00,30.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-7','Standard Loan - Tier 7',16.50,'DECLINING',1,60,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 13:26:50',NULL,9,2500001.00,3500000.00,30.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-8','Standard Loan - Tier 8',17.00,'DECLINING',1,96,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 13:26:50',NULL,10,3500001.00,7000000.00,35.00,15.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-9','Vehicle Purchase Loan',16.50,'DECLINING',1,60,2.00,1,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-10 13:26:50',NULL,3,0.00,3500000.00,50.00,10.00,1,'VEHICLE','SAV_COMPULSORY,SAV_VOLUNTARY');
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
-- Table structure for table `loan_tier_eligible_account_products`
--

DROP TABLE IF EXISTS `loan_tier_eligible_account_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_tier_eligible_account_products` (
  `tier_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_product_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`tier_id`,`account_product_code`),
  KEY `fk_tier_eligible_account_product` (`account_product_code`),
  CONSTRAINT `fk_tier_eligible_account_product` FOREIGN KEY (`account_product_code`) REFERENCES `account_products` (`product_code`),
  CONSTRAINT `fk_tier_eligible_tier` FOREIGN KEY (`tier_id`) REFERENCES `loan_product_tiers` (`tier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_tier_eligible_account_products`
--

LOCK TABLES `loan_tier_eligible_account_products` WRITE;
/*!40000 ALTER TABLE `loan_tier_eligible_account_products` DISABLE KEYS */;
INSERT INTO `loan_tier_eligible_account_products` VALUES ('41000000-0000-4000-8000-000000000001','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000002','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000003','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000004','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000005','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000006','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000007','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000008','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000009','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000010','SAV_COMPULSORY'),('4f0371fc-cc45-46d6-ae71-1f11e328e17e','SAV_COMPULSORY'),('a883b71d-9a47-11f1-99e6-7e0b432c7d55','SAV_COMPULSORY'),('a883b99f-9a47-11f1-99e6-7e0b432c7d55','SAV_COMPULSORY'),('a883bbc1-9a47-11f1-99e6-7e0b432c7d55','SAV_COMPULSORY'),('a883bd77-9a47-11f1-99e6-7e0b432c7d55','SAV_COMPULSORY'),('a883be9b-9a47-11f1-99e6-7e0b432c7d55','SAV_COMPULSORY'),('a883bfdd-9a47-11f1-99e6-7e0b432c7d55','SAV_COMPULSORY'),('a883c09d-9a47-11f1-99e6-7e0b432c7d55','SAV_COMPULSORY'),('a883c156-9a47-11f1-99e6-7e0b432c7d55','SAV_COMPULSORY'),('a883c68f-9a47-11f1-99e6-7e0b432c7d55','SAV_COMPULSORY'),('a883c89c-9a47-11f1-99e6-7e0b432c7d55','SAV_COMPULSORY');
/*!40000 ALTER TABLE `loan_tier_eligible_account_products` ENABLE KEYS */;
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
INSERT INTO `members` VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','MEM-2024-0001','Bereket','Gedamu','Sewnet','+251965500639','bereket@example.com','MALE','MARRIED',NULL,0,0,NULL,NULL,NULL,'Bole','04',NULL,NULL,NULL,0,0,NULL,'123','GOV_EMP',35000.00,'TIN-001','ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC',NULL,'2026-08-10 20:44:35',NULL,0,NULL,NULL,'2026-08-10 20:44:35',NULL),('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','MEM-2024-0002','Alemitu',NULL,'Tesfaye','+251965500540','alemitu@example.com','FEMALE','SINGLE',NULL,0,0,NULL,NULL,NULL,'Yeka','05',NULL,NULL,NULL,0,0,NULL,'456','SME',45000.00,'TIN-002','ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC',NULL,'2026-08-10 20:44:35',NULL,0,NULL,NULL,'2026-08-10 20:44:35',NULL);
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
INSERT INTO `notifications` VALUES ('2188015c-c7c9-4ed9-91fa-8ad68b677355','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','LOAN_REJECTED','Loan Application Rejected','Your loan application has been rejected.','{\"reason\": null, \"loan_id\": \"a63fb754-0643-40cb-bf02-bca5ff1ead6c\"}',0,NULL,'2026-08-11 18:03:05','2026-08-11 18:03:05'),('ac30f1d7-b462-452b-b7ab-43876ccc501e','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','LOAN_APPROVED','Loan Application Approved','Your loan application for ETB 10,000.00 has been approved. Product: L-EDU','{\"loan_id\": \"2c8f5b2c-d710-4d27-8c4b-92ca33e58631\", \"product_code\": \"L-EDU\", \"approved_amount\": \"10000.00\"}',0,NULL,'2026-08-11 18:02:54','2026-08-11 18:02:54');
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
-- Table structure for table `profit_bucket_eligible_products`
--

DROP TABLE IF EXISTS `profit_bucket_eligible_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profit_bucket_eligible_products` (
  `bucket_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`bucket_id`,`product_code`),
  KEY `fk_profit_eligible_product` (`product_code`),
  CONSTRAINT `fk_profit_eligible_bucket` FOREIGN KEY (`bucket_id`) REFERENCES `profit_distribution_buckets` (`bucket_id`),
  CONSTRAINT `fk_profit_eligible_product` FOREIGN KEY (`product_code`) REFERENCES `account_products` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profit_bucket_eligible_products`
--

LOCK TABLES `profit_bucket_eligible_products` WRITE;
/*!40000 ALTER TABLE `profit_bucket_eligible_products` DISABLE KEYS */;
INSERT INTO `profit_bucket_eligible_products` VALUES ('42000000-0000-4000-8000-000000000012','SAV_COMPULSORY');
/*!40000 ALTER TABLE `profit_bucket_eligible_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profit_distribution_allocations`
--

DROP TABLE IF EXISTS `profit_distribution_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profit_distribution_allocations` (
  `allocation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `distribution_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bucket_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bucket_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `percentage_bps` int NOT NULL,
  `allocation_basis` enum('SHARE_UNITS','SAVINGS_BALANCE','INTERNAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_member_payable` tinyint(1) NOT NULL,
  `allocated_amount` decimal(18,2) NOT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`allocation_id`),
  UNIQUE KEY `uq_distribution_bucket` (`distribution_id`,`bucket_code`),
  CONSTRAINT `fk_distribution_allocation` FOREIGN KEY (`distribution_id`) REFERENCES `profit_distributions` (`distribution_id`),
  CONSTRAINT `profit_distribution_allocations_chk_1` CHECK ((`allocated_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profit_distribution_allocations`
--

LOCK TABLES `profit_distribution_allocations` WRITE;
/*!40000 ALTER TABLE `profit_distribution_allocations` DISABLE KEYS */;
INSERT INTO `profit_distribution_allocations` VALUES ('104e1b62-41c5-4ae8-84cb-f6a83ac09ab7','a70d8219-1b05-42a6-85e9-9f060acfb3d3','EDUCATION_TRAINING','Education and Training',400,'INTERNAL',0,4.00,3),('6ece64df-9f93-4b60-96ea-4eed3a23a1e8','a70d8219-1b05-42a6-85e9-9f060acfb3d3','STATUTORY_ALLOCATION_2','Statutory Allocation 2',200,'INTERNAL',0,2.00,5),('853b1b95-773b-480a-8698-d586c6efe452','a70d8219-1b05-42a6-85e9-9f060acfb3d3','STATUTORY_ALLOCATION_4','Statutory Allocation 4',400,'INTERNAL',0,4.00,7),('91a14337-6223-48e5-869e-e5ebc6c3f1e9','a70d8219-1b05-42a6-85e9-9f060acfb3d3','STATUTORY_ALLOCATION_1','Statutory Allocation 1',100,'INTERNAL',0,1.00,4),('ad6ee349-d988-4584-b656-ac8acf65e4ff','a70d8219-1b05-42a6-85e9-9f060acfb3d3','MEMBER_SHARE_DIVIDEND','Share Capital Fund',4900,'SHARE_UNITS',1,49.00,1),('ccf5e8c7-2b35-4baa-a4e1-e19dea32d30b','a70d8219-1b05-42a6-85e9-9f060acfb3d3','STATUTORY_ALLOCATION_3','Statutory Allocation 3',200,'INTERNAL',0,2.00,6),('e7315943-50b9-48bf-a8e9-6f439b21ceeb','a70d8219-1b05-42a6-85e9-9f060acfb3d3','MEMBER_SAVINGS_DIVIDEND','Members Regular Savings Fund',800,'SAVINGS_BALANCE',1,8.00,2);
/*!40000 ALTER TABLE `profit_distribution_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profit_distribution_board_votes`
--

DROP TABLE IF EXISTS `profit_distribution_board_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profit_distribution_board_votes` (
  `vote_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `distribution_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `voter_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `decision` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `decided_at` datetime DEFAULT NULL,
  `rejection_resolved` tinyint(1) NOT NULL DEFAULT '0',
  `resolved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolution_reason` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` datetime DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vote_id`),
  UNIQUE KEY `uq_profit_distribution_voter` (`distribution_id`,`voter_id`),
  KEY `fk_profit_vote_voter` (`voter_id`),
  KEY `fk_profit_vote_resolver` (`resolved_by`),
  CONSTRAINT `fk_profit_vote_distribution` FOREIGN KEY (`distribution_id`) REFERENCES `profit_distributions` (`distribution_id`),
  CONSTRAINT `fk_profit_vote_resolver` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_profit_vote_voter` FOREIGN KEY (`voter_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profit_distribution_board_votes`
--

LOCK TABLES `profit_distribution_board_votes` WRITE;
/*!40000 ALTER TABLE `profit_distribution_board_votes` DISABLE KEYS */;
INSERT INTO `profit_distribution_board_votes` VALUES ('3d37ca81-5647-47b6-90be-efc3f2852610','a70d8219-1b05-42a6-85e9-9f060acfb3d3','60291a7a-861e-4e70-85ec-393b35dbc514','APPROVED','Reviewed and approved development distribution','2026-08-17 22:14:29',0,NULL,NULL,NULL,'2026-08-17 22:14:29'),('975c8300-146c-404d-8207-6dcc90fcf190','a70d8219-1b05-42a6-85e9-9f060acfb3d3','f958daf4-e8a7-4d6e-8a32-b7a3d768ce98','APPROVED','Reviewed and approved development distribution','2026-08-17 22:14:29',0,NULL,NULL,NULL,'2026-08-17 22:14:29');
/*!40000 ALTER TABLE `profit_distribution_board_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profit_distribution_buckets`
--

DROP TABLE IF EXISTS `profit_distribution_buckets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profit_distribution_buckets` (
  `bucket_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `policy_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bucket_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `percentage_bps` int NOT NULL,
  `allocation_basis` enum('SHARE_UNITS','SAVINGS_BALANCE','INTERNAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_member_payable` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`bucket_id`),
  UNIQUE KEY `uq_profit_bucket_code` (`policy_id`,`bucket_code`),
  KEY `idx_profit_bucket_policy` (`policy_id`,`display_order`),
  CONSTRAINT `fk_profit_bucket_policy` FOREIGN KEY (`policy_id`) REFERENCES `profit_distribution_policies` (`policy_id`),
  CONSTRAINT `profit_distribution_buckets_chk_1` CHECK (((`percentage_bps` >= 0) and (`percentage_bps` <= 10000)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profit_distribution_buckets`
--

LOCK TABLES `profit_distribution_buckets` WRITE;
/*!40000 ALTER TABLE `profit_distribution_buckets` DISABLE KEYS */;
INSERT INTO `profit_distribution_buckets` VALUES ('42000000-0000-4000-8000-000000000011','42000000-0000-4000-8000-000000000001','MEMBER_SHARE_DIVIDEND','Share Capital Fund',4900,'SHARE_UNITS',1,1,'2026-08-17 22:10:51'),('42000000-0000-4000-8000-000000000012','42000000-0000-4000-8000-000000000001','MEMBER_SAVINGS_DIVIDEND','Members Regular Savings Fund',800,'SAVINGS_BALANCE',1,2,'2026-08-17 22:10:51'),('42000000-0000-4000-8000-000000000013','42000000-0000-4000-8000-000000000001','EDUCATION_TRAINING','Education and Training',400,'INTERNAL',0,3,'2026-08-17 22:10:51'),('42000000-0000-4000-8000-000000000014','42000000-0000-4000-8000-000000000001','ENVIRONMENTAL_DEVELOPMENT','Environmental Development and Protection Fund (የአካባቢ ልማትና ጥበቃ)',100,'INTERNAL',0,4,'2026-08-17 22:10:51'),('42000000-0000-4000-8000-000000000015','42000000-0000-4000-8000-000000000001','EMPLOYEE_INCENTIVE','Employee Incentive Fund (የሠራተኞች ማበረታቻ)',200,'INTERNAL',0,5,'2026-08-17 22:10:51'),('42000000-0000-4000-8000-000000000016','42000000-0000-4000-8000-000000000001','BOARD_COMMITTEE_INCENTIVE','Board and Committee Incentive Fund (የቦርድና ኮሚቴ ማበረታቻ)',200,'INTERNAL',0,6,'2026-08-17 22:10:51'),('42000000-0000-4000-8000-000000000017','42000000-0000-4000-8000-000000000001','LOAN_LOSS_RESERVE','Loan Loss Reserve (የማይመለስ ብድር መጠባበቂያ)',400,'INTERNAL',0,7,'2026-08-17 22:10:51');
/*!40000 ALTER TABLE `profit_distribution_buckets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profit_distribution_member_allocations`
--

DROP TABLE IF EXISTS `profit_distribution_member_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profit_distribution_member_allocations` (
  `member_allocation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `distribution_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `share_balance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `calculated_share_units` bigint unsigned NOT NULL DEFAULT '0',
  `override_share_units` bigint unsigned DEFAULT NULL,
  `share_override_reason` text COLLATE utf8mb4_unicode_ci,
  `share_overridden_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `share_overridden_at` datetime DEFAULT NULL,
  `eligible_savings_balance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `share_dividend_amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `savings_dividend_amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `total_payout_amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `payout_account_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payout_transaction_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payout_status` enum('PENDING','PAID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_allocation_id`),
  UNIQUE KEY `uq_distribution_member` (`distribution_id`,`member_id`),
  KEY `idx_member_profit_allocations` (`member_id`,`distribution_id`),
  KEY `fk_member_allocation_override_user` (`share_overridden_by`),
  KEY `fk_member_allocation_account` (`payout_account_id`),
  KEY `fk_member_allocation_transaction` (`payout_transaction_id`),
  CONSTRAINT `fk_member_allocation_account` FOREIGN KEY (`payout_account_id`) REFERENCES `accounts` (`account_id`),
  CONSTRAINT `fk_member_allocation_distribution` FOREIGN KEY (`distribution_id`) REFERENCES `profit_distributions` (`distribution_id`),
  CONSTRAINT `fk_member_allocation_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  CONSTRAINT `fk_member_allocation_override_user` FOREIGN KEY (`share_overridden_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_member_allocation_transaction` FOREIGN KEY (`payout_transaction_id`) REFERENCES `transactions` (`txn_id`),
  CONSTRAINT `profit_distribution_member_allocations_chk_1` CHECK ((`share_balance` >= 0)),
  CONSTRAINT `profit_distribution_member_allocations_chk_2` CHECK ((`eligible_savings_balance` >= 0)),
  CONSTRAINT `profit_distribution_member_allocations_chk_3` CHECK ((`share_dividend_amount` >= 0)),
  CONSTRAINT `profit_distribution_member_allocations_chk_4` CHECK ((`savings_dividend_amount` >= 0)),
  CONSTRAINT `profit_distribution_member_allocations_chk_5` CHECK ((`total_payout_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profit_distribution_member_allocations`
--

LOCK TABLES `profit_distribution_member_allocations` WRITE;
/*!40000 ALTER TABLE `profit_distribution_member_allocations` DISABLE KEYS */;
INSERT INTO `profit_distribution_member_allocations` VALUES ('ae3c788b-e6b6-4129-8c48-07a059652135','a70d8219-1b05-42a6-85e9-9f060acfb3d3','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',5000.00,16,16,'Verified full paid shares against the development ledger','11111111-1111-1111-1111-111111111111','2026-08-17 22:14:29',15000.00,49.00,3.43,52.43,'acc-1111-aaaa-bbbb-ccccdddd0001','95497de1-bac5-425f-882e-105c1208e84d','PAID','2026-08-17 22:14:29','2026-08-17 22:14:29'),('cc81b964-d076-47ac-ab43-9e008b905be5','a70d8219-1b05-42a6-85e9-9f060acfb3d3','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',0.00,0,NULL,NULL,NULL,NULL,20000.00,0.00,4.57,4.57,'acc-2222-aaaa-bbbb-ccccdddd0001','0f4f79b7-aa02-4b29-b87a-574785b136ed','PAID','2026-08-17 22:14:29','2026-08-17 22:14:29');
/*!40000 ALTER TABLE `profit_distribution_member_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profit_distribution_policies`
--

DROP TABLE IF EXISTS `profit_distribution_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profit_distribution_policies` (
  `policy_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `policy_version` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reserve_bps` int NOT NULL,
  `board_quorum_count` int NOT NULL DEFAULT '2',
  `payout_product_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','RETIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `retired_at` datetime DEFAULT NULL,
  PRIMARY KEY (`policy_id`),
  UNIQUE KEY `uq_profit_policy_version` (`policy_version`),
  KEY `idx_profit_policy_status` (`status`,`policy_version`),
  KEY `fk_profit_policy_product` (`payout_product_code`),
  KEY `fk_profit_policy_creator` (`created_by`),
  CONSTRAINT `fk_profit_policy_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_profit_policy_product` FOREIGN KEY (`payout_product_code`) REFERENCES `account_products` (`product_code`),
  CONSTRAINT `profit_distribution_policies_chk_1` CHECK (((`reserve_bps` >= 0) and (`reserve_bps` <= 10000))),
  CONSTRAINT `profit_distribution_policies_chk_2` CHECK ((`board_quorum_count` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profit_distribution_policies`
--

LOCK TABLES `profit_distribution_policies` WRITE;
/*!40000 ALTER TABLE `profit_distribution_policies` DISABLE KEYS */;
INSERT INTO `profit_distribution_policies` VALUES ('42000000-0000-4000-8000-000000000001',1,'Alef Delta Statutory Profit Distribution',3000,2,'SAV_COMPULSORY','ACTIVE',NULL,'2026-08-17 22:10:51',NULL);
/*!40000 ALTER TABLE `profit_distribution_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profit_distributions`
--

DROP TABLE IF EXISTS `profit_distributions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profit_distributions` (
  `distribution_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `policy_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `ledger_cutoff_at` datetime NOT NULL,
  `status` enum('DRAFT','PENDING_BOARD','READY_FOR_PAYOUT','PAID','REJECTED','VOID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `total_inflows` decimal(18,2) NOT NULL,
  `total_outflows` decimal(18,2) NOT NULL,
  `net_profit` decimal(18,2) NOT NULL,
  `reserve_amount` decimal(18,2) NOT NULL,
  `member_payout_amount` decimal(18,2) NOT NULL,
  `retained_allocation_amount` decimal(18,2) NOT NULL,
  `share_price` decimal(18,2) NOT NULL,
  `total_share_units` bigint unsigned NOT NULL,
  `total_eligible_savings` decimal(18,2) NOT NULL,
  `policy_snapshot` json NOT NULL,
  `generated_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `paid_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `payout_ledger_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voided_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `void_reason` text COLLATE utf8mb4_unicode_ci,
  `voided_at` datetime DEFAULT NULL,
  `version` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`distribution_id`),
  KEY `idx_profit_distribution_period` (`period_start`,`period_end`,`status`),
  KEY `idx_profit_distribution_status` (`status`,`created_at`),
  KEY `fk_profit_distribution_policy` (`policy_id`),
  KEY `fk_profit_distribution_generator` (`generated_by`),
  KEY `fk_profit_distribution_submitter` (`submitted_by`),
  KEY `fk_profit_distribution_payer` (`paid_by`),
  KEY `fk_profit_distribution_voider` (`voided_by`),
  KEY `fk_profit_distribution_payout_ledger` (`payout_ledger_id`),
  CONSTRAINT `fk_profit_distribution_generator` FOREIGN KEY (`generated_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_profit_distribution_payer` FOREIGN KEY (`paid_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_profit_distribution_payout_ledger` FOREIGN KEY (`payout_ledger_id`) REFERENCES `sacco_master_ledger` (`ledger_id`),
  CONSTRAINT `fk_profit_distribution_policy` FOREIGN KEY (`policy_id`) REFERENCES `profit_distribution_policies` (`policy_id`),
  CONSTRAINT `fk_profit_distribution_submitter` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_profit_distribution_voider` FOREIGN KEY (`voided_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `profit_distributions_chk_1` CHECK ((`period_end` >= `period_start`)),
  CONSTRAINT `profit_distributions_chk_2` CHECK ((`net_profit` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profit_distributions`
--

LOCK TABLES `profit_distributions` WRITE;
/*!40000 ALTER TABLE `profit_distributions` DISABLE KEYS */;
INSERT INTO `profit_distributions` VALUES ('a70d8219-1b05-42a6-85e9-9f060acfb3d3','42000000-0000-4000-8000-000000000001','2026-08-17','2026-08-17','2026-08-17 22:14:29','PAID',100.00,0.00,100.00,30.00,57.00,13.00,300.00,16,35000.00,'{\"name\": \"Alef Delta Statutory Profit Distribution\", \"buckets\": [{\"name\": \"Share Capital Fund\", \"bucket_code\": \"MEMBER_SHARE_DIVIDEND\", \"percentage_bps\": 4900, \"allocation_basis\": \"SHARE_UNITS\", \"eligible_products\": [], \"is_member_payable\": true}, {\"name\": \"Members Regular Savings Fund\", \"bucket_code\": \"MEMBER_SAVINGS_DIVIDEND\", \"percentage_bps\": 800, \"allocation_basis\": \"SAVINGS_BALANCE\", \"eligible_products\": [\"SAV_COMPULSORY\"], \"is_member_payable\": true}, {\"name\": \"Education and Training\", \"bucket_code\": \"EDUCATION_TRAINING\", \"percentage_bps\": 400, \"allocation_basis\": \"INTERNAL\", \"eligible_products\": [], \"is_member_payable\": false}, {\"name\": \"Statutory Allocation 1\", \"bucket_code\": \"STATUTORY_ALLOCATION_1\", \"percentage_bps\": 100, \"allocation_basis\": \"INTERNAL\", \"eligible_products\": [], \"is_member_payable\": false}, {\"name\": \"Statutory Allocation 2\", \"bucket_code\": \"STATUTORY_ALLOCATION_2\", \"percentage_bps\": 200, \"allocation_basis\": \"INTERNAL\", \"eligible_products\": [], \"is_member_payable\": false}, {\"name\": \"Statutory Allocation 3\", \"bucket_code\": \"STATUTORY_ALLOCATION_3\", \"percentage_bps\": 200, \"allocation_basis\": \"INTERNAL\", \"eligible_products\": [], \"is_member_payable\": false}, {\"name\": \"Statutory Allocation 4\", \"bucket_code\": \"STATUTORY_ALLOCATION_4\", \"percentage_bps\": 400, \"allocation_basis\": \"INTERNAL\", \"eligible_products\": [], \"is_member_payable\": false}], \"policy_id\": \"42000000-0000-4000-8000-000000000001\", \"reserve_bps\": 3000, \"policy_version\": 1, \"board_quorum_count\": 2, \"payout_product_code\": \"SAV_COMPULSORY\"}','11111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','2026-08-17 22:14:29','11111111-1111-1111-1111-111111111111','2026-08-17 22:14:29','54298cb6-4f1c-4553-b80b-98af8539b60b',NULL,NULL,NULL,6,'2026-08-17 22:14:29','2026-08-17 22:14:29');
/*!40000 ALTER TABLE `profit_distributions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sacco_master_account`
--

DROP TABLE IF EXISTS `sacco_master_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sacco_master_account` (
  `account_key` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ETB',
  `balance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `version` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_key`),
  CONSTRAINT `sacco_master_account_chk_1` CHECK ((`balance` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sacco_master_account`
--

LOCK TABLES `sacco_master_account` WRITE;
/*!40000 ALTER TABLE `sacco_master_account` DISABLE KEYS */;
INSERT INTO `sacco_master_account` VALUES ('ETB_MASTER','ETB',38.00,4,'2026-08-17 22:10:51','2026-08-17 23:00:22');
/*!40000 ALTER TABLE `sacco_master_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sacco_master_ledger`
--

DROP TABLE IF EXISTS `sacco_master_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sacco_master_ledger` (
  `ledger_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_key` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ETB_MASTER',
  `entry_date` date NOT NULL,
  `posted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `direction` enum('INFLOW','OUTFLOW') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entry_type` enum('REGISTRATION_FEE','LOAN_INTEREST','LOAN_PENALTY','SAVINGS_INTEREST','MANUAL_REVENUE','MANUAL_EXPENSE','OPENING_ADJUSTMENT','DIVIDEND_PAYOUT','REVERSAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `balance_after` decimal(18,2) NOT NULL,
  `affects_profit` tinyint(1) NOT NULL DEFAULT '1',
  `source_type` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_component` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `distribution_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `idempotency_key` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reversal_of` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ledger_id`),
  UNIQUE KEY `uq_master_source_component` (`source_type`,`source_id`,`source_component`),
  UNIQUE KEY `uq_master_idempotency` (`idempotency_key`),
  KEY `idx_master_ledger_date` (`entry_date`,`posted_at`),
  KEY `idx_master_ledger_type` (`entry_type`,`direction`),
  KEY `fk_master_ledger_account` (`account_key`),
  KEY `fk_master_ledger_distribution` (`distribution_id`),
  KEY `fk_master_ledger_user` (`performed_by`),
  KEY `fk_master_ledger_reversal` (`reversal_of`),
  CONSTRAINT `fk_master_ledger_account` FOREIGN KEY (`account_key`) REFERENCES `sacco_master_account` (`account_key`),
  CONSTRAINT `fk_master_ledger_distribution` FOREIGN KEY (`distribution_id`) REFERENCES `profit_distributions` (`distribution_id`),
  CONSTRAINT `fk_master_ledger_reversal` FOREIGN KEY (`reversal_of`) REFERENCES `sacco_master_ledger` (`ledger_id`),
  CONSTRAINT `fk_master_ledger_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `sacco_master_ledger_chk_1` CHECK ((`amount` > 0)),
  CONSTRAINT `sacco_master_ledger_chk_2` CHECK ((`balance_after` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sacco_master_ledger`
--

LOCK TABLES `sacco_master_ledger` WRITE;
/*!40000 ALTER TABLE `sacco_master_ledger` DISABLE KEYS */;
INSERT INTO `sacco_master_ledger` VALUES ('298cae15-a9ba-4e12-bca4-12821f2f6485','ETB_MASTER','2026-08-17','2026-08-17 23:00:22','OUTFLOW','MANUAL_EXPENSE',5.00,38.00,1,'MANUAL_ADJUSTMENT','8b1534c3-e8ec-45b0-be30-c03f3e50c28a','OUTFLOW',NULL,'11111111-1111-1111-1111-111111111111','ggdsgdgdfgdfgdf','8b1534c3-e8ec-45b0-be30-c03f3e50c28a',NULL,'2026-08-17 23:00:22'),('54298cb6-4f1c-4553-b80b-98af8539b60b','ETB_MASTER','2026-08-17','2026-08-17 22:14:29','OUTFLOW','DIVIDEND_PAYOUT',57.00,43.00,0,'PROFIT_DISTRIBUTION','a70d8219-1b05-42a6-85e9-9f060acfb3d3','MEMBER_PAYOUT','a70d8219-1b05-42a6-85e9-9f060acfb3d3','11111111-1111-1111-1111-111111111111','Member dividend payout for 2026-08-17 through 2026-08-17','E2E:PROFIT:PAYOUT:a70d8219-1b05-42a6-85e9-9f060acfb3d3',NULL,'2026-08-17 22:14:29'),('ef1ea05f-3089-46bf-8a9f-6ef53253d776','ETB_MASTER','2026-08-17','2026-08-17 22:14:29','INFLOW','MANUAL_REVENUE',100.00,100.00,1,'MANUAL_ADJUSTMENT','E2E:PROFIT:REVENUE:20260817','INFLOW',NULL,'11111111-1111-1111-1111-111111111111','Development verification revenue for profit distribution','E2E:PROFIT:REVENUE:20260817',NULL,'2026-08-17 22:14:29');
/*!40000 ALTER TABLE `sacco_master_ledger` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_sacco_master_ledger_no_update` BEFORE UPDATE ON `sacco_master_ledger` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SACCO master ledger entries are append-only and cannot be updated' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_sacco_master_ledger_no_delete` BEFORE DELETE ON `sacco_master_ledger` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SACCO master ledger entries are append-only and cannot be deleted' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

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
INSERT INTO `schema_migrations` VALUES ('01_init_schema.sql','2026-08-10 13:26:44'),('02_add_indexes.sql','2026-08-10 13:26:44'),('03_add_verification_fields.sql','2026-08-10 13:26:45'),('04_add_id_card_separate_fields.sql','2026-08-10 13:26:45'),('05_add_beneficiary_profile_photo.sql','2026-08-10 13:26:45'),('06_add_guarantor_profile_and_duty.sql','2026-08-10 13:26:45'),('07_update_guarantors_to_standalone.sql','2026-08-10 13:26:46'),('08_add_pending_status_to_members.sql','2026-08-10 13:26:46'),('09_add_category_to_loan_products.sql','2026-08-10 13:26:46'),('10_create_account_products.sql','2026-08-10 13:26:46'),('11_expand_account_products.sql','2026-08-10 13:26:46'),('12_add_system_jobs_and_takaful.sql','2026-08-10 13:26:46'),('13_create_deposit_requests.sql','2026-08-10 13:26:46'),('14_collateral_multiple_documents.sql','2026-08-10 13:26:46'),('14_create_loan_repayment_requests.sql','2026-08-10 13:26:46'),('15_add_quarterly_repayment.sql','2026-08-10 13:26:46'),('16_create_loan_repayments.sql','2026-08-10 13:26:47'),('17_add_penalty_tracking.sql','2026-08-10 13:26:47'),('17_create_notifications.sql','2026-08-10 13:26:47'),('18_add_interest_tracking.sql','2026-08-10 13:26:48'),('19_add_member_inactivity_tracking.sql','2026-08-10 13:26:48'),('20_update_member_registration_fields.sql','2026-08-10 13:26:49'),('21_create_emergency_contacts.sql','2026-08-10 13:26:49'),('22_create_member_documents.sql','2026-08-10 13:26:49'),('23_add_registration_receipt_document_type.sql','2026-08-10 13:26:49'),('24_create_member_registration_requests.sql','2026-08-10 13:26:49'),('25_add_teller_approved_status.sql','2026-08-10 13:26:49'),('26_add_age_to_guarantors.sql','2026-08-10 13:26:49'),('27_add_share_price_config.sql','2026-08-10 13:26:49'),('28_add_bank_receipt_to_loan_repayments.sql','2026-08-10 13:26:50'),('29_create_partner_requests.sql','2026-08-10 13:26:50'),('30_create_loan_requests.sql','2026-08-10 13:26:50'),('31_add_tier_fields_to_loan_products.sql','2026-08-10 13:26:50'),('32_seed_loan_tiers.sql','2026-08-10 13:26:50'),('33_add_eligible_savings_types.sql','2026-08-10 13:26:50'),('34_create_loan_amortization_schedule.sql','2026-08-11 11:26:51'),('35_add_loan_penalty_policy.sql','2026-08-11 17:28:36'),('36_add_board_loan_approval_workflow.sql','2026-08-11 17:53:28'),('37_add_loan_penalty_rate_snapshot.sql','2026-08-11 18:36:21'),('38_add_loan_service_charge_policy.sql','2026-08-11 20:51:59'),('39_add_loan_insurance.sql','2026-08-12 18:15:52'),('40_create_loan_insurance_rate_matrix.sql','2026-08-12 18:45:47'),('41_add_dynamic_loan_tiers.sql','2026-08-17 14:26:38'),('42_add_profit_distribution_and_master_ledger.sql','2026-08-17 22:10:51'),('43_protect_master_ledger.sql','2026-08-17 22:27:20'),('44_name_profit_distribution_buckets.sql','2026-08-17 23:13:50');
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
INSERT INTO `system_config` VALUES ('inactivity_check_enabled','true','Enable automatic inactivity status updates',NULL,'2026-08-10 13:26:48'),('loan_insurance_discount_pct','0','Optional reduction from the insurance ceiling rate; must be 0 or greater and can never increase the matrix rate',NULL,'2026-08-12 18:15:52'),('loan_insurance_enabled','true','Enable mandatory loan life insurance calculation','11111111-1111-1111-1111-111111111111','2026-08-12 18:18:21'),('member_inactive_days','90','Days of inactivity before member becomes INACTIVE (default 90 = 3 months)',NULL,'2026-08-10 13:26:48'),('member_terminated_days','365','Days of inactivity before member becomes TERMINATED (default 365 = 1 year)',NULL,'2026-08-10 13:26:48'),('min_shares_required','10','Minimum shares required for membership (used to compute member share lien)','11111111-1111-1111-1111-111111111111','2026-08-17 13:12:29'),('penalty_rate_default','2.0','Default penalty rate for overdue loans (%)',NULL,'2026-08-10 13:26:48'),('registration_fee_etb','1000','Registration fee recognized as SACCO revenue on first member activation',NULL,'2026-08-17 22:10:51'),('share_price','300','Share price in ETB (used to compute member share lien)',NULL,'2026-08-10 13:26:49');
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
INSERT INTO `transactions` VALUES ('0f4f79b7-aa02-4b29-b87a-574785b136ed','acc-2222-aaaa-bbbb-ccccdddd0001','DEPOSIT',4.57,20004.57,'Profit distribution a70d8219-1b05-42a6-85e9-9f060acfb3d3',NULL,'11111111-1111-1111-1111-111111111111','DIVIDEND:a70d8219-1b05-42a6-85e9-9f060acfb3d3:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','2026-08-17 22:14:29'),('95497de1-bac5-425f-882e-105c1208e84d','acc-1111-aaaa-bbbb-ccccdddd0001','DEPOSIT',52.43,15052.43,'Profit distribution a70d8219-1b05-42a6-85e9-9f060acfb3d3',NULL,'11111111-1111-1111-1111-111111111111','DIVIDEND:a70d8219-1b05-42a6-85e9-9f060acfb3d3:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','2026-08-17 22:14:29');
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
  `role` enum('ADMIN','TELLER','CREDIT_OFFICER','MANAGER','AUDITOR','BOARD_MEMBER') COLLATE utf8mb4_unicode_ci NOT NULL,
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
INSERT INTO `users` VALUES ('11111111-1111-1111-1111-111111111111','admin','$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC','ADMIN','admin@gmail.com','+251911111111','ACTIVE',NULL,0,'2026-08-10 20:44:35','2026-08-10 20:44:35'),('22222222-2222-2222-2222-222222222222','teller','$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC','TELLER','teller@gmail.com','+251922222222','ACTIVE',NULL,0,'2026-08-10 20:44:35','2026-08-10 20:44:35'),('33333333-3333-3333-3333-333333333333','credit.officer','$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC','CREDIT_OFFICER','credit.officer@gmail.com','+251933333333','ACTIVE',NULL,0,'2026-08-10 20:44:35','2026-08-10 20:44:35'),('3cf744df-e02e-4d74-813c-9ac4f8561bc3','e2e_manager','$2b$10$PvMd/rN9ogP.Vkg4MSQ/1ecEmQs8CfK/AM5iv9i1tbvmvrYYyC8X6','MANAGER','e2e_manager@example.test','+251900000000','ACTIVE',NULL,0,'2026-08-11 18:02:13','2026-08-11 18:02:13'),('44444444-4444-4444-4444-444444444444','manager','$2b$12$AEAxdvFJDg16I/KtC8xfU.UQCAcTySGjXlVWUpqrtp5ARIM33ZxIC','MANAGER','manager@gmail.com','+251944444444','ACTIVE',NULL,0,'2026-08-10 20:44:35','2026-08-10 20:44:35'),('5be0eb6c-5c42-4da5-88a4-f727c8ee9ad3','e2e_credit','$2b$10$PvMd/rN9ogP.Vkg4MSQ/1ecEmQs8CfK/AM5iv9i1tbvmvrYYyC8X6','CREDIT_OFFICER','e2e_credit@example.test','+251900000000','ACTIVE',NULL,0,'2026-08-11 18:02:13','2026-08-11 18:02:13'),('60291a7a-861e-4e70-85ec-393b35dbc514','e2e_board1','$2b$10$Qk6lg/NC8120TheP6C2I1.BRPOxpXmLIcoNENwdsJBvtwg7kW808q','BOARD_MEMBER','e2e_board1@example.test','+251900000000','ACTIVE',NULL,0,'2026-08-11 18:02:13','2026-08-11 18:10:25'),('83b6f4eb-ae3e-4cea-b06b-62a9eb05f0ed','e2e_auditor','$2b$12$ej7ODpDZnZ7NR4F4saJgcuc7Qk7HvN0lRK6gJtZTBNjPq8jHS5BFq','AUDITOR','e2e-auditor@alefdelta.com','+251911170817','ACTIVE',NULL,0,'2026-08-17 22:21:19','2026-08-17 22:21:19'),('f958daf4-e8a7-4d6e-8a32-b7a3d768ce98','e2e_board2','$2b$12$SEjpdlMJB4et0w2XVf3oJuqUH8uChemxQlJn1uT.dkppQ.mZwwPwe','BOARD_MEMBER','e2e_board2@example.test','+251900000000','ACTIVE','2026-08-17 22:13:57',1,'2026-08-11 18:02:13','2026-08-17 22:13:57');
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

-- Dump completed on 2026-08-17 23:25:11
