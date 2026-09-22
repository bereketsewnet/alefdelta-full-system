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
INSERT INTO `account_products` VALUES ('SAV_COMPULSORY','Savings - Compulsory','STANDARD','Compulsory savings account for all members','SAVINGS','COMPULSORY_SAVINGS','STANDARD',0,0,0,NULL,1,0.00,0.00,0.00,'PROFIT_SHARING',0.00,NULL,NULL,NULL,'2026-08-31 22:05:45','2026-08-31 22:05:48',0,0,NULL,1,0.00,0,NULL),('SAV_VOLUNTARY','VOLUNTARY SAVING','STANDARD',NULL,NULL,'VOLUNTARY_SAVINGS','STANDARD',0,0,0,NULL,1,100.00,100.00,7.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-09-16 13:41:54','2026-09-16 14:08:38',0,0,NULL,1,0.00,0,NULL),('SAV-CHILD','CHILDREN SAVING','STANDARD',NULL,NULL,'VOLUNTARY_SAVINGS','CHILDREN',1,0,0,NULL,1,100.00,100.00,9.00,'STANDARD',0.00,NULL,NULL,NULL,'2026-09-01 09:26:34','2026-09-01 09:26:34',0,0,NULL,1,0.00,0,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','08f0703b-6290-449d-8415-1db0a51c6c45','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(2,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','79b6c42e-6d0a-486a-b7c6-472be5b0e8c2','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(3,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','44f945ac-6933-4973-9d61-b4297b419889','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(4,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','1bee65a1-40c4-4d18-b5c4-c282d38275c5','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(5,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','593e199b-b6df-4898-91b7-3e00e263c119','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(6,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','62f48de4-6dee-48a8-8ec5-077d7157d201','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(7,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','502dd89b-159e-4fd0-804a-58d1963e9ac6','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(8,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','6c1309a3-c4d6-479e-847d-b078d7905d70','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(9,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','b9b6e2d7-a7f4-464a-b852-7b62f5878663','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(10,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','9c4a5afe-890d-4e53-a5ae-d092f4d303d4','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(11,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','a8e3e83d-f32d-4e51-8e2f-2a02d3adfa7d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(12,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','f9d812a0-eff4-4a37-a454-6a13c0b185a1','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(13,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','b88df60c-58e3-424a-92a1-6b57933f6485','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(14,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','c7457ba2-5c56-469f-81ca-bb7a9373803d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(15,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','9781cf3d-b7a2-4e3f-b00b-10fd6c7fb33e','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(16,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','d504bb2b-711a-463a-bcda-7c504ea82b2e','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(17,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','08b34078-fc63-4367-bfd9-0f4f8141e3b1','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(18,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','862e459e-855c-4f66-99d7-489c4bf0656e','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(19,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','7838f795-41cf-438a-a360-3b5ed451c9d3','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(20,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','3a783381-eb38-4680-ba13-be1f4034b47d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(21,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','e9ff7367-3f84-47e7-bdbb-a672ea1f1bb0','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(22,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','b6836deb-7d87-4bdc-b4a3-fdcdab80e9c8','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(23,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','06e9ded4-2b6d-44e2-887d-22c27682d03f','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(24,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','608a3826-b684-4417-a37f-4017c75b55d0','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(25,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','0da17060-6e84-4bf9-8978-b00f747dc15c','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(26,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','b0f4fdd9-30c8-470f-9f9d-5db9e7c57c6b','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(27,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','8fe3662b-99c8-4942-81aa-b1fddac08fe0','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(28,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','208f6539-aef6-428d-9a6b-6ea1bd2605bd','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:04'),(29,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','383a8906-176a-49e3-ba93-348f8be5150b','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(30,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','017bf1be-3d8f-4a8d-8fe8-a7fed105c685','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(31,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','cfb7adcc-fc58-40a3-8207-e453137e5984','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(32,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','ac699f8a-52d4-4199-9bec-852b30e6ef1c','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(33,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','0920f343-0712-42bc-bbeb-b4ae1d836466','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(34,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','d8f7d3ec-6eb8-4c1c-a31a-0187b282bf94','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(35,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','986ed510-06ad-4f65-962c-72bb3441eb99','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(36,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','0b5728a6-6e77-4803-b9f8-4e219a6faa8f','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(37,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','85097b59-ad30-4432-ba3f-1710d48204ac','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(38,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','bc28d672-c24a-46f3-9b7d-81d3d1a00225','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(39,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','48cfd890-0914-4076-a259-03e46486fbeb','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(40,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','1c8bd681-cbc7-4824-b2bc-3de9a98613b7','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(41,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','76f4bf15-7dc2-4345-b9da-90eccdf326e5','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(42,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','f7f38717-eb3d-4c2a-913b-ee20504f0549','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(43,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','3e5ccd73-bec4-4818-878a-53165c232f00','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(44,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','a67c1e45-2923-41b1-9959-f6834cce1c83','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(45,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','dfaf6650-0edf-4ba1-a80d-f3cf24e0df6a','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(46,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','6c3c9d84-6641-4bdd-95f2-7e7bb813e0db','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(47,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','645c2b01-09de-4a57-8607-b5401fafcfb4','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(48,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','c004dc05-dcd6-420a-803c-d62e755ee3fc','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(49,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','c11b3152-8933-4933-809f-e5689a41077c','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(50,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','c15a9a7f-be02-4fbd-831a-c780b174b3b3','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(51,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','264a489f-e4bc-49b5-9713-83a41eb0388a','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(52,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','5543ea44-90ed-40ba-9633-b2afc4cc7c5b','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(53,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','3e95ee8a-2164-4e2a-842c-d05030bf4793','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(54,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','e033d589-00ae-4989-a945-922f99bf6ca1','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(55,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','fabc1046-8283-4729-889c-e3903e6db85e','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(56,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','54dee1ac-d21c-430f-95c0-f5e7425e4cee','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(57,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','66829223-0fcf-4c3f-89e9-d21f48c9d8b6','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(58,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','10886ad4-baf4-464b-9032-4401b9322390','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(59,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','5cb029d7-6c3d-4107-9cc5-5538de7448fc','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(60,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','de4d257e-dcff-4f19-a38f-ba1ee4634013','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(61,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','cdd7702f-480d-4f69-b68d-fca7344d493e','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(62,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','4b4776de-1afa-413e-a0f9-e498ee5c7982','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(63,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','866522a0-d12b-4043-abde-46e12ee96100','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(64,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','3c5e5da5-b74b-4c05-a26d-9c8547d4822d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(65,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','4a4db1fb-8cf8-4df9-b643-e19c8b968340','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(66,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','936a9216-5709-4dce-801d-0c9c5cea0949','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(67,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','e42a2906-13b2-43ab-b9b5-66763f7aa92d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(68,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','e6cc6534-75c3-401b-878e-8a452b9e5000','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(69,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','8dcbb4b6-c861-408c-8867-bf59ab4c77bf','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(70,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','5a3a33f1-85fc-4d55-b1c4-e15da227f290','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(71,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','91dceba9-9f0e-4722-a1b5-4c1e9fb86ef4','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(72,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','f6cf5ace-b9f7-4bff-be56-78d7563e372e','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(73,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','567aac30-1354-483c-8c68-5206a15f6090','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(74,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','94a6c8cc-406c-4907-8542-abe12f21246f','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(75,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','2852a107-bc21-4f5a-bc4a-71c1ce965132','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(76,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','fe4ee5da-7c5a-4b8e-bcb3-a199fe52386d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(77,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','09341a83-984b-4bb3-923d-9b9f9250a11b','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(78,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','7fd5769d-2109-4bad-bd2b-f7ffe0ebf5df','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(79,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','5fda041f-2188-47c5-b6f5-ac4c2bac846c','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(80,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','7e350710-1a9c-444a-b6a1-c78f2b591faf','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(81,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','9c052ffd-489c-4e4c-900d-6d8b4c8ccd87','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(82,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','10392591-18e4-4de5-b976-7e6b2b968f65','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(83,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','9976f7fa-74ec-4722-9355-4c4cd9153895','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(84,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','7e6aca46-e4b6-4b39-83ee-f849b1dc0033','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(85,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','956366e2-7821-419f-8716-932d5a636af6','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(86,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','11284571-9548-49b5-88bb-b4d42c977db8','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(87,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','41ebdd83-9aa7-4bf3-bd83-835f33dff1e2','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(88,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','e490409b-c4d9-4c70-8ccc-d39cbc9b9766','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(89,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','126673bd-4f5c-467f-b654-6fdffa3ad543','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(90,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','b6d36e13-ec2d-426b-ab6d-a540fc74c91e','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(91,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','40789668-76a3-4194-91e4-93f1166b732b','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(92,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','e7cc4280-0dad-48de-ac17-20914e711a76','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(93,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','03546121-ca8a-4426-9300-dba2ab4e4994','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(94,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','e64135b5-1f0e-4236-bc89-ee1e65b71f3f','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(95,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','7eca5692-46d3-4f81-bfa8-9ac5af1613e3','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(96,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','9fd14da0-5691-4045-8085-b69571eadf1f','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(97,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','3bcc492c-4391-4639-96b6-203f809f31a1','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(98,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','24c8f6b4-9580-4b8f-ae5d-4fac3c8996c9','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(99,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','1c470d20-183e-4c25-9640-6bec5b5db4ca','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(100,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','b38514bb-791c-4474-94c0-ef608f20e944','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(101,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','35540088-1f1f-4e9e-86fc-79104fbb3f25','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(102,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','e3762222-c40e-491d-bd8c-6aa7a1fbb567','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(103,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','2bc3e407-014a-4af5-994d-6e00e9669495','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(104,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','907adecd-706b-4d81-bf4d-f02c4598e487','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(105,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','5cbddaa1-2df2-4617-a8e7-199f65ae89ba','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(106,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','710a9ba7-75b2-4f4b-a0a7-c84f0539d75c','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(107,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','192b7726-b9ff-4907-93cd-a03140224321','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(108,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','9745b5fa-423b-4e90-bb15-79dffa205cb5','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(109,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','f5b59e3f-80e8-42fb-913f-dfeb464c01e6','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(110,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','0d874cb9-f99b-40c8-b038-1df415c0c126','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:05'),(111,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','c29a457f-17ed-4413-be42-2f48975fa1d4','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(112,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','ca062c8a-de77-47f4-83ff-1b5c47e66599','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(113,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','53d62144-8ccd-475e-9aec-a159785f628d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(114,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','3cf96762-7ae3-4470-af2b-857c99159a84','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(115,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','a3c75b02-a9d6-4552-983e-4846681292ed','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(116,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','9e4cec16-f3a3-4dfa-b697-5ed0a8e6ac95','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(117,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','e3a6d8b7-13a2-472c-950b-63fc8de1a6d5','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(118,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','c886caca-a7fa-4956-8548-6a19318af6ab','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(119,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','43ef26d2-9882-4279-a444-e3284eccdc9e','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(120,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','6f292535-9f8e-4394-b13d-b68aefc00790','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(121,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','b249b8b2-cc5a-41ea-8d13-976ee69a5080','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(122,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','44bd0a08-1a30-4269-8f80-9a3de285d097','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(123,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','0814feff-34cb-4b08-9676-a3a43d31a027','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(124,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','92a251d4-ed3e-47ab-8d2c-248521f0a51e','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(125,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','f229a23f-0f38-4a9b-8d6b-1a3983f24c02','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(126,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','6979abe2-647f-4e3d-b500-779138a8abb5','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(127,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','98b59f4a-1dc6-492d-aebf-a3e9e88af88b','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(128,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','d0e435f0-a7a3-4dc8-8693-460eb145ad07','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(129,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','a06c2b4a-6140-447b-983b-b2ec19a2c2da','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(130,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','ad6218e0-5708-4e21-90cc-878b02064836','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(131,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','26c0f9ca-ac0a-4a1b-a064-99aff20ba32d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(132,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','bba9c7d1-7bf0-4b2a-a5ac-ef1937b639ad','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(133,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','fd245c91-605f-4955-ae7e-56058ddc3a7d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(134,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','ef8d58bc-3ed0-4d28-8ce4-ebc60cc1bc1d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(135,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','ba5971e6-c954-459a-b552-d6866f36b629','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(136,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','14db8a32-793d-4e81-a682-183d55a83360','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(137,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','beb99821-29c5-4e2a-b280-2d5c8aa32c8d','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(138,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','9c7c2051-b365-4da7-8206-7c132251ecce','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(139,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','234fda18-4684-4a70-aa99-1b8d7ede3b2f','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(140,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','ceec09bf-3ab2-4625-b1f3-e04a8727e13c','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(141,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','5a87b252-9cb1-4451-b4ab-8f5d50867685','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(142,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','348d0db5-c8dc-4630-b17c-924bcc5ded93','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(143,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','81eee018-fd80-48c9-9e0d-af6e96239e3e','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(144,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','ed6d69cc-2b7e-4de7-bb85-60898d8d2e8f','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(145,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','6917e0df-354c-4997-8048-5a26356a51d0','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(146,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','a5af51cc-2f79-49a6-adaf-0a30c5428338','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06'),(147,'710299d7-7dfd-435d-8a1e-717ce51e5ede','ACTIVATE_MEMBER','members','96c2148a-7005-47ee-a8bc-6098e60b7bc1','{\"status\": \"PENDING\"}','{\"status\": \"ACTIVE\"}','null','2026-09-16 14:00:06');
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
INSERT INTO `emergency_contacts` VALUES ('01815dce-2a59-4d49-839c-e9a8e31a1965','fe4ee5da-7c5a-4b8e-bcb3-a199fe52386d','TILAHUN RETA',NULL,NULL,NULL,NULL,'0938804920',NULL,'2026-09-09 14:54:29','2026-09-09 14:54:29'),('01f795c5-df63-459e-b820-62509c0bf674','0814feff-34cb-4b08-9676-a3a43d31a027','G/TINSAE',NULL,NULL,NULL,NULL,'0928994930',NULL,'2026-09-10 10:43:51','2026-09-10 10:43:51'),('04407c2d-d6a6-40ad-b2fc-f88bddc0ad47','3c5e5da5-b74b-4c05-a26d-9c8547d4822d','AMEN TADESE',NULL,NULL,NULL,NULL,'0928996678',NULL,'2026-09-09 13:29:36','2026-09-09 13:29:36'),('04a8c07d-9dc3-48c6-ad45-84efe1ec1922','6c3c9d84-6641-4bdd-95f2-7e7bb813e0db','AMEN KEBEDE',NULL,NULL,NULL,NULL,'0980489620',NULL,'2026-09-09 12:06:54','2026-09-09 12:06:54'),('052f70e5-f511-4a6b-9d30-5d4924d7e29c','3bcc492c-4391-4639-96b6-203f809f31a1','SHEFERAW',NULL,NULL,NULL,NULL,'0911970498',NULL,'2026-09-09 17:13:42','2026-09-09 17:13:42'),('0d05ec8e-37f1-4a2a-9648-2f2797b61ff3','ef8d58bc-3ed0-4d28-8ce4-ebc60cc1bc1d','SHUME TULU',NULL,NULL,NULL,NULL,'0914402738',NULL,'2026-09-10 11:57:42','2026-09-10 11:57:42'),('106702f6-055a-473b-b406-747ee4fab353','1bee65a1-40c4-4d18-b5c4-c282d38275c5','TEHAY MEKUANENT','BOLE','13',NULL,'10','+251938036840',NULL,'2026-09-08 12:57:45','2026-09-08 12:57:45'),('113c3dec-971d-4915-b05d-1a0d442b420e','bba9c7d1-7bf0-4b2a-a5ac-ef1937b639ad','ALEMU BELAY',NULL,NULL,NULL,NULL,'0900799944',NULL,'2026-09-10 11:52:07','2026-09-10 11:52:07'),('1229e862-4c4e-453b-8c1b-8399e1c8c0a4','fd245c91-605f-4955-ae7e-56058ddc3a7d','WERKITU DEMESE',NULL,NULL,NULL,NULL,'0910684472',NULL,'2026-09-10 11:54:25','2026-09-10 11:54:25'),('14bc94a9-1958-4bdd-ae3b-6adc98e1e77d','502dd89b-159e-4fd0-804a-58d1963e9ac6','MAHELET BIRHANU','ADDIS KETEMA','06','30','502','+251983433470',NULL,'2026-09-08 13:24:15','2026-09-08 13:24:15'),('14dce7c0-e90f-46cc-9e27-94234354ed99','6c1309a3-c4d6-479e-847d-b078d7905d70','ZENEBECH METEKIYA','YEKA','02','03','792','+251913447252',NULL,'2026-09-08 13:35:07','2026-09-08 13:35:07'),('1554cfce-3b65-4b93-8e7c-2b9b20b9e85f','92a251d4-ed3e-47ab-8d2c-248521f0a51e','BETEL TEKELE',NULL,NULL,NULL,NULL,'0913432211',NULL,'2026-09-10 11:28:48','2026-09-10 11:28:48'),('1755d234-4a74-4e43-bb7b-4a97c458259f','5fda041f-2188-47c5-b6f5-ac4c2bac846c','MARAMAWIT BEKELE',NULL,NULL,NULL,NULL,'092994029',NULL,'2026-09-09 15:12:58','2026-09-09 15:12:58'),('1820f406-939c-4117-aba6-9cd55117860c','11284571-9548-49b5-88bb-b4d42c977db8','WORKNESH KEBEDE',NULL,NULL,NULL,NULL,'0920482020',NULL,'2026-09-09 15:53:33','2026-09-09 15:53:33'),('19abba83-b116-4214-9ecb-02b10112c1df','5cb029d7-6c3d-4107-9cc5-5538de7448fc','DEMEKECH BELETE',NULL,NULL,NULL,NULL,'0942246496',NULL,'2026-09-09 13:11:32','2026-09-09 13:11:32'),('21688cb5-72d1-40c0-9a58-7c4ecf976850','08f0703b-6290-449d-8415-1db0a51c6c45','WENDESEN ARAGAW','LEMI KURA','14',NULL,'180/25','+251911653987',NULL,'2026-09-08 12:06:02','2026-09-08 12:06:02'),('22c2fdb7-7c43-42fd-9d4d-361780ebd9a9','9745b5fa-423b-4e90-bb15-79dffa205cb5','HENOK',NULL,NULL,NULL,NULL,'0929049414',NULL,'2026-09-10 08:43:44','2026-09-10 08:43:44'),('22efec4c-88ed-4161-bde6-f9395a63af92','4a4db1fb-8cf8-4df9-b643-e19c8b968340','HERMELA BELACHEW',NULL,NULL,NULL,NULL,'0933493897',NULL,'2026-09-09 13:32:19','2026-09-09 13:32:19'),('242b9f7b-0cd9-4b6a-8c32-71e8b7ccdf81','94a6c8cc-406c-4907-8542-abe12f21246f','KEBEDE BEYENE',NULL,NULL,NULL,NULL,'0930982599',NULL,'2026-09-09 14:16:05','2026-09-09 14:16:05'),('250ec515-06e5-4746-b795-b9fa36d534ba','ad6218e0-5708-4e21-90cc-878b02064836','HIWOT G/MICHAEL',NULL,NULL,NULL,NULL,'O911199206',NULL,'2026-09-10 11:47:30','2026-09-10 11:47:30'),('269360ad-2244-4a42-a2f9-bd6f5686fc74','3e5ccd73-bec4-4818-878a-53165c232f00','YOGELE MEKONEN','YEKA09','09',NULL,NULL,'0967304761',NULL,'2026-09-09 11:49:21','2026-09-09 11:49:21'),('2c54c753-09f5-434b-80db-8a85109ba838','ca062c8a-de77-47f4-83ff-1b5c47e66599','YODIT MULUGETA',NULL,NULL,NULL,NULL,'0911634244',NULL,'2026-09-10 10:03:08','2026-09-10 10:03:08'),('2c9985e6-0b04-4b66-a1b7-d1a3183b87c4','c7457ba2-5c56-469f-81ca-bb7a9373803d','SAFANIT BIRHANU',NULL,NULL,NULL,'502','+251938168781',NULL,'2026-09-08 14:21:29','2026-09-08 14:21:29'),('2d77a6ed-1629-4806-9ef9-9eaa68228fee','53d62144-8ccd-475e-9aec-a159785f628d','ADANE',NULL,NULL,NULL,NULL,'0913638314',NULL,'2026-09-10 10:05:44','2026-09-10 10:05:44'),('2e04cdfd-78fe-47f4-a1c1-6a7d6625a1f1','66829223-0fcf-4c3f-89e9-d21f48c9d8b6','ABERACH ABEBE',NULL,NULL,NULL,NULL,'0929384599',NULL,'2026-09-09 13:00:57','2026-09-09 13:00:57'),('306a367c-686c-4c41-a4f9-6b22015a3581','936a9216-5709-4dce-801d-0c9c5cea0949','ALEMNESH ABEBE',NULL,NULL,NULL,NULL,'0928996788',NULL,'2026-09-09 13:35:37','2026-09-09 13:35:37'),('310e9725-3111-474c-bd81-a76c86ff53b5','b6d36e13-ec2d-426b-ab6d-a540fc74c91e','GEDETA GUNFA',NULL,NULL,NULL,NULL,'0913387745',NULL,'2026-09-09 16:16:00','2026-09-09 16:16:00'),('33657686-ba36-4ddc-b4a6-f78668ae9258','e490409b-c4d9-4c70-8ccc-d39cbc9b9766','BEREKET ADISU',NULL,NULL,NULL,NULL,'0980182563',NULL,'2026-09-09 16:05:43','2026-09-09 16:05:43'),('3646f858-f63d-46dd-9fa6-63931d2be8c1','79b6c42e-6d0a-486a-b7c6-472be5b0e8c2','MAHIDER G/KIRSTOS HORA','K.K',NULL,NULL,NULL,'+251965607869',NULL,'2026-09-08 12:30:05','2026-09-08 12:30:05'),('365a357d-9827-47fb-96e3-b7c6a4dd4db0','09341a83-984b-4bb3-923d-9b9f9250a11b','MESRET YELMA',NULL,NULL,NULL,NULL,'0945996729',NULL,'2026-09-09 14:57:51','2026-09-09 14:57:51'),('3badd244-b085-4893-9ac7-6dcd2e7a6ae2','03546121-ca8a-4426-9300-dba2ab4e4994','TENAGNE',NULL,NULL,NULL,NULL,'091096909026',NULL,'2026-09-09 16:44:16','2026-09-09 16:44:16'),('3be02a22-0da3-40cb-9b92-6061a27b5e2d','f229a23f-0f38-4a9b-8d6b-1a3983f24c02','EFERAM TADESE',NULL,NULL,NULL,NULL,'0923514934',NULL,'2026-09-10 11:33:45','2026-09-10 11:33:45'),('3c165f91-1c7d-48d7-a545-edb997fc5799','96c2148a-7005-47ee-a8bc-6098e60b7bc1','HIWOT G/TINSAYE',NULL,NULL,NULL,NULL,'0911475201',NULL,'2026-09-10 12:38:54','2026-09-10 12:38:54'),('3c7cf9bf-6ce9-486d-9a84-98aa67e09438','645c2b01-09de-4a57-8607-b5401fafcfb4','AREGA KEBEDE',NULL,NULL,NULL,NULL,'0940283980',NULL,'2026-09-09 12:10:03','2026-09-09 12:10:03'),('3c818b61-a107-43a5-8d39-48a12de5e32f','0da17060-6e84-4bf9-8978-b00f747dc15c','TILAHUN GIRMA','K.K',NULL,NULL,NULL,'0911354500',NULL,'2026-09-08 15:53:16','2026-09-08 15:53:16'),('3fa9fef4-d08f-4258-8b9e-5291cf4a657b','c29a457f-17ed-4413-be42-2f48975fa1d4','WERKILU DEMESE',NULL,NULL,NULL,NULL,'0910684472',NULL,'2026-09-10 10:00:50','2026-09-10 10:00:50'),('40140c7f-8f9f-4cbf-be27-2708bba54a3b','e64135b5-1f0e-4236-bc89-ee1e65b71f3f','YOHANES TEBABAL',NULL,NULL,NULL,NULL,'0911414901',NULL,'2026-09-09 16:49:01','2026-09-09 16:49:01'),('46a09042-10ea-4098-86d6-833042701ca2','7e6aca46-e4b6-4b39-83ee-f849b1dc0033','ALEM BEKELE',NULL,NULL,NULL,NULL,'0901452690',NULL,'2026-09-09 15:39:58','2026-09-09 15:39:58'),('4d13f9b7-631a-46ef-adba-b36a66f4d7c8','e3762222-c40e-491d-bd8c-6aa7a1fbb567','ABEDU YEMAME',NULL,NULL,NULL,NULL,'0911265839',NULL,'2026-09-10 08:22:20','2026-09-10 08:22:20'),('4fe9832b-336d-4e49-a754-2489307230ce','593e199b-b6df-4898-91b7-3e00e263c119','E.R HESKIYEL HABTE','LEMI KURA','03',NULL,'B4/480','+25135107085',NULL,'2026-09-08 13:04:59','2026-09-08 13:04:59'),('51f4f379-ae40-444d-91be-855fe7d00e63','41ebdd83-9aa7-4bf3-bd83-835f33dff1e2','ABERACH AYELE',NULL,NULL,NULL,NULL,'0960289948',NULL,'2026-09-09 15:57:46','2026-09-09 15:57:46'),('536cf271-b887-4758-aac9-2a945c980e15','dfaf6650-0edf-4ba1-a80d-f3cf24e0df6a','SELAMAWIT ABEBE',NULL,NULL,NULL,NULL,'0978921279',NULL,'2026-09-09 12:03:29','2026-09-09 12:03:29'),('548be2d7-8ff5-42f7-a6a5-7cd7bed598a5','e033d589-00ae-4989-a945-922f99bf6ca1','RETA GARA',NULL,NULL,NULL,NULL,'0928413049',NULL,'2026-09-09 12:49:02','2026-09-09 12:49:02'),('57805b94-f859-421a-81dc-9251018bc848','44f945ac-6933-4973-9d61-b4297b419889','ADISU','N/F/L','12',NULL,'425/29','+251936263937',NULL,'2026-09-08 12:40:34','2026-09-08 12:40:34'),('58f304ab-25f3-4e95-a984-984ede92c32c','234fda18-4684-4a70-aa99-1b8d7ede3b2f','FIKERTE TAYE',NULL,NULL,NULL,NULL,'0913767463',NULL,'2026-09-10 12:13:50','2026-09-10 12:13:50'),('5c3f3a29-ff3f-4692-8ad2-77c9c3b424ae','54dee1ac-d21c-430f-95c0-f5e7425e4cee','ERGAET YOSEPH',NULL,NULL,NULL,NULL,'0969289945',NULL,'2026-09-09 12:58:10','2026-09-09 12:58:10'),('5fdca13b-7fc6-421b-addb-fbbe8a31d375','5543ea44-90ed-40ba-9633-b2afc4cc7c5b','TERU BIRHAN',NULL,NULL,NULL,NULL,'0947193425',NULL,'2026-09-09 12:36:19','2026-09-09 12:36:19'),('61293076-7c65-4b98-a30f-d1d0e94d6390','6f292535-9f8e-4394-b13d-b68aefc00790','ALAMERE MENGESTE',NULL,NULL,NULL,NULL,'0950664975',NULL,'2026-09-10 10:36:01','2026-09-10 10:36:01'),('69931ac4-d7fb-4a01-8112-f0666b3e4e5e','7fd5769d-2109-4bad-bd2b-f7ffe0ebf5df','TIZETA ALEMU',NULL,NULL,NULL,NULL,'0933432091',NULL,'2026-09-09 15:03:01','2026-09-09 15:03:01'),('6bb9824a-8080-4659-bb63-78824d3c808d','192b7726-b9ff-4907-93cd-a03140224321','SHEWA TSEHAYE',NULL,NULL,NULL,NULL,'0931668440',NULL,'2026-09-10 08:40:28','2026-09-10 08:40:28'),('6cd7b9d0-d272-4d85-97ce-7fe0ca420d3d','862e459e-855c-4f66-99d7-489c4bf0656e','ALEME ESHETU',NULL,NULL,NULL,NULL,'0969013377',NULL,'2026-09-08 15:01:08','2026-09-08 15:01:08'),('6da3a185-3ed4-4e26-89dd-a1c7bc002150','10886ad4-baf4-464b-9032-4401b9322390','LIDIYA DANIEL',NULL,NULL,NULL,NULL,'0928996721',NULL,'2026-09-09 13:07:35','2026-09-09 13:07:35'),('74efe5cf-953a-4894-b094-71e20f6a78b7','de4d257e-dcff-4f19-a38f-ba1ee4634013','AYANTU HAKAYE',NULL,NULL,NULL,NULL,'0969334767',NULL,'2026-09-09 13:14:08','2026-09-09 13:14:08'),('7856f6c3-6294-4d1e-9989-c7d98410d8b1','14db8a32-793d-4e81-a682-183d55a83360','HIWOT ABERA',NULL,NULL,NULL,NULL,'0912171519',NULL,'2026-09-10 12:05:44','2026-09-10 12:05:44'),('7cd1169c-8551-491a-a90e-732f8a999a3c','c004dc05-dcd6-420a-803c-d62e755ee3fc','ANGACH ABEBAW',NULL,NULL,NULL,NULL,'0904147366',NULL,'2026-09-09 12:13:33','2026-09-09 12:13:33'),('7ef2aefa-982e-4fb1-81d2-dd8bc0cfad20','d504bb2b-711a-463a-bcda-7c504ea82b2e','ESKEDAR BIRHANU',NULL,NULL,NULL,NULL,'091102 8181',NULL,'2026-09-08 14:52:03','2026-09-08 14:52:03'),('830b4f1f-3342-4781-baf4-3ee56953988e','a67c1e45-2923-41b1-9959-f6834cce1c83','MESEKERM KEBEDE',NULL,NULL,NULL,NULL,'0910442038',NULL,'2026-09-09 12:00:15','2026-09-09 12:00:15'),('85f72945-5496-400f-ac09-a94b629b4be4','e6cc6534-75c3-401b-878e-8a452b9e5000','WORKNESH BEKELE',NULL,NULL,NULL,NULL,'0949556796',NULL,'2026-09-09 13:42:24','2026-09-09 13:42:24'),('860ca1a5-2007-44b9-877f-5b383465311d','9781cf3d-b7a2-4e3f-b00b-10fd6c7fb33e','MAHELET BIRHANU ',NULL,NULL,NULL,'502','0983434370',NULL,'2026-09-08 14:30:41','2026-09-08 14:30:41'),('872fe98e-afbc-45ee-b3c1-f83668cc2b14','a3c75b02-a9d6-4552-983e-4846681292ed','DESETA SISAY',NULL,NULL,NULL,NULL,'0919886214',NULL,'2026-09-10 10:09:57','2026-09-10 10:09:57'),('8e1fa35a-368c-464d-bf1a-5fb0c7330000','62f48de4-6dee-48a8-8ec5-077d7157d201','BETELHEM HAYELU','YEKA','02',NULL,NULL,'+251912121069',NULL,'2026-09-08 13:14:37','2026-09-08 13:14:37'),('9130e2ae-c822-47d2-ad16-d9c5b62e0a60','9976f7fa-74ec-4722-9355-4c4cd9153895','FELEKE TEGEGN',NULL,NULL,NULL,NULL,'0920459966',NULL,'2026-09-09 15:38:15','2026-09-09 15:38:15'),('926d9309-c2f8-473c-8328-d05d8daf9187','c886caca-a7fa-4956-8548-6a19318af6ab','TAZEB RORES',NULL,NULL,NULL,NULL,'0918015000',NULL,'2026-09-10 10:31:50','2026-09-10 10:31:50'),('9379ca66-3072-4c7a-b846-e1ad7902bb44','7e350710-1a9c-444a-b6a1-c78f2b591faf','WORKNESH ABERA',NULL,NULL,NULL,NULL,'0910224435',NULL,'2026-09-09 15:17:43','2026-09-09 15:17:43'),('94856e92-9cd7-4f6b-a1c4-1e1367fef720','264a489f-e4bc-49b5-9713-83a41eb0388a','MERON ABATE',NULL,NULL,NULL,NULL,'0940557940',NULL,'2026-09-09 12:31:52','2026-09-09 12:31:52'),('9ac46975-4a1f-488a-80ae-82d05618d9da','b9b6e2d7-a7f4-464a-b852-7b62f5878663','NIKODIMOS KASAHUN','YEKA','12','03','098','+251912363787',NULL,'2026-09-08 13:41:07','2026-09-08 13:41:07'),('9bdfd7a5-a865-4d0a-8816-c070dc89c11e','b6836deb-7d87-4bdc-b4a3-fdcdab80e9c8','MULU DEMESE',NULL,NULL,NULL,NULL,'0911428653',NULL,'2026-09-08 15:21:16','2026-09-08 15:21:16'),('9d106ec3-d275-4826-9da6-64ac9593590e','a5af51cc-2f79-49a6-adaf-0a30c5428338','GETACHEW MEKONNEN',NULL,NULL,NULL,NULL,'0903100565',NULL,'2026-09-10 12:35:40','2026-09-10 12:35:40'),('a0f10ad8-b5bb-41e8-b321-d0db6c219449','567aac30-1354-483c-8c68-5206a15f6090','AMEHA BEKELE',NULL,NULL,NULL,NULL,'0941996747',NULL,'2026-09-09 14:09:57','2026-09-09 14:09:57'),('a39af42e-1127-4774-886c-61a908c0cbe6','9c052ffd-489c-4e4c-900d-6d8b4c8ccd87','HANA ABERA',NULL,NULL,NULL,NULL,'0950422297',NULL,'2026-09-09 15:20:09','2026-09-09 15:20:09'),('a425449f-e6ba-4bfe-bc18-97c6940dbef9','91dceba9-9f0e-4722-a1b5-4c1e9fb86ef4','ALEM BEKELE',NULL,NULL,NULL,NULL,'0946495150',NULL,'2026-09-09 13:57:36','2026-09-09 13:57:36'),('a523801c-6a8a-465e-b8e4-827433ca5c28','98b59f4a-1dc6-492d-aebf-a3e9e88af88b','REHIMA WERKU',NULL,NULL,NULL,NULL,'0923974946',NULL,'2026-09-10 11:39:31','2026-09-10 11:39:31'),('a96dc9e6-93a3-4903-8fd2-781c79ba741d','956366e2-7821-419f-8716-932d5a636af6','MULU TILAHUN',NULL,NULL,NULL,NULL,'0930452095',NULL,'2026-09-09 15:49:17','2026-09-09 15:49:17'),('ab83eb61-5382-4365-8a4f-479fc8b33e3e','8dcbb4b6-c861-408c-8867-bf59ab4c77bf','ABEBECH ABEBE',NULL,NULL,NULL,NULL,'0936783919',NULL,'2026-09-09 13:49:03','2026-09-09 13:49:03'),('adfb4749-8da4-40b2-a224-f8a0e2f8ade7','b249b8b2-cc5a-41ea-8d13-976ee69a5080','MULUGETA GEBERE',NULL,NULL,NULL,NULL,'0911402617',NULL,'2026-09-10 10:38:13','2026-09-10 10:38:13'),('b213dbf4-e676-4003-812a-6ff665a36454','f6cf5ace-b9f7-4bff-be56-78d7563e372e','AYELE BEKELE',NULL,NULL,NULL,NULL,'0928394898',NULL,'2026-09-09 14:01:36','2026-09-09 14:01:36'),('b359d69f-beb3-431e-9565-80da3b441fb4','24c8f6b4-9580-4b8f-ae5d-4fac3c8996c9','AYALEW ABERA',NULL,NULL,NULL,NULL,'0920468893',NULL,'2026-09-09 17:21:06','2026-09-09 17:21:06'),('b44e431f-c9c1-431f-bda4-31dd37764ba5','126673bd-4f5c-467f-b654-6fdffa3ad543','TESEFAW TARIKU',NULL,NULL,NULL,NULL,'0945204697',NULL,'2026-09-09 16:09:14','2026-09-09 16:09:14'),('b579f036-4b8b-4ec3-9026-3d01be8c727a','10392591-18e4-4de5-b976-7e6b2b968f65','ALEMNESH TAYE',NULL,NULL,NULL,NULL,'0930452096',NULL,'2026-09-09 15:25:23','2026-09-09 15:25:23'),('b7e1e7a2-c6a1-44ce-b15c-57aedf0a3a58','26c0f9ca-ac0a-4a1b-a064-99aff20ba32d','SELOMON',NULL,NULL,NULL,NULL,'0911437830',NULL,'2026-09-10 11:49:35','2026-09-10 11:49:35'),('b9b22e11-6006-48af-bd5e-1564b93d11c8','e42a2906-13b2-43ab-b9b5-66763f7aa92d','BEKELECH ABATE',NULL,NULL,NULL,NULL,'0959349678',NULL,'2026-09-09 13:39:10','2026-09-09 13:39:10'),('ba61b219-9548-4e3f-b2b6-d97e9c7527df','fabc1046-8283-4729-889c-e3903e6db85e','MARETA TADESE',NULL,NULL,NULL,NULL,'0922976620',NULL,'2026-09-09 12:54:24','2026-09-09 12:54:24'),('bbbf53f9-2cfa-4e9a-b1c5-849cdc0f04f2','beb99821-29c5-4e2a-b280-2d5c8aa32c8d','TINSYE',NULL,NULL,NULL,NULL,'0911141647',NULL,'2026-09-10 12:08:13','2026-09-10 12:08:13'),('bcad3e97-e0b1-4048-b573-7fa51c2a77e9','6917e0df-354c-4997-8048-5a26356a51d0','LEULSEGED',NULL,NULL,NULL,NULL,'0923003762',NULL,'2026-09-10 12:32:16','2026-09-10 12:32:16'),('be2b75fd-f93c-49da-887a-932d03f9b72b','ba5971e6-c954-459a-b552-d6866f36b629','ESEHIWOT TATEK',NULL,NULL,NULL,NULL,'0906640225',NULL,'2026-09-10 12:02:07','2026-09-10 12:02:07'),('c0fef764-291f-4f6a-a711-7a5b8770bb2a','b88df60c-58e3-424a-92a1-6b57933f6485','BEZA TESEMA',NULL,NULL,NULL,NULL,'+251922776994',NULL,'2026-09-08 14:15:24','2026-09-08 14:15:24'),('c13262c7-5f7d-4cdf-bff1-a8b8de2ac78d','ed6d69cc-2b7e-4de7-bb85-60898d8d2e8f','ABEBAW ANDUALEM',NULL,NULL,NULL,NULL,'0911599491',NULL,'2026-09-10 12:28:53','2026-09-10 12:28:53'),('c37c9fd2-a582-4f9a-a86e-c850f9333f4b','9fd14da0-5691-4045-8085-b69571eadf1f','RAHEL EKUBEKEEGZI',NULL,NULL,NULL,NULL,'0902642751',NULL,'2026-09-09 17:03:59','2026-09-09 17:03:59'),('c3a73684-c5f6-4fe0-b31c-a56bfdbbe616','9c4a5afe-890d-4e53-a5ae-d092f4d303d4','ELSA W/GIORGIS','GULELE','07','04','469/4','+251945423490',NULL,'2026-09-08 13:52:39','2026-09-08 13:52:39'),('cbb95b82-4e7f-4c8a-8010-cf732130dea9','608a3826-b684-4417-a37f-4017c75b55d0','YESHIALEM TAKELE','KIRKOS','10','14',NULL,'0923087943',NULL,'2026-09-08 15:46:43','2026-09-08 15:46:43'),('cf1ddfbb-82ab-4eda-b3b9-bfdd04c878a5','b38514bb-791c-4474-94c0-ef608f20e944','TADELU TULU',NULL,NULL,NULL,NULL,'0910319374',NULL,'2026-09-09 17:27:19','2026-09-09 17:27:19'),('cf6b1b13-4062-4c60-aa31-1a6bce3f4249','e7cc4280-0dad-48de-ac17-20914e711a76','TAYE NEGASH',NULL,NULL,NULL,NULL,'0913447851',NULL,'2026-09-09 16:31:47','2026-09-09 16:31:47'),('cf9b9df6-f228-4b37-a635-8e2de7b5bcfd','f5b59e3f-80e8-42fb-913f-dfeb464c01e6','TAREKEGN',NULL,NULL,NULL,NULL,'0989162223',NULL,'2026-09-10 09:51:15','2026-09-10 09:51:15'),('d2f074e4-c486-4973-9ec3-31e1187927d8','c15a9a7f-be02-4fbd-831a-c780b174b3b3','MEKEDELAWIT GETACHEW',NULL,NULL,NULL,NULL,'0988493258',NULL,'2026-09-09 12:27:43','2026-09-09 12:27:43'),('d4e70c40-529a-4260-85fe-66853b6bc542','f7f38717-eb3d-4c2a-913b-ee20504f0549','EDEN EMESHAW','YEKA','12',NULL,NULL,'0932847679',NULL,'2026-09-09 11:42:28','2026-09-09 11:42:28'),('d53e30be-a79a-4f99-99c4-e52d3f7e540e','866522a0-d12b-4043-abde-46e12ee96100','AYELECH MAMO',NULL,NULL,NULL,NULL,'0969376791',NULL,'2026-09-09 13:26:25','2026-09-09 13:26:25'),('d6c5b719-25d4-45a3-a055-ae948b9d835f','a06c2b4a-6140-447b-983b-b2ec19a2c2da','KOKEB AGEZU',NULL,NULL,NULL,NULL,'0911938461',NULL,'2026-09-10 11:44:50','2026-09-10 11:44:50'),('d919e7cb-1879-4742-b527-6680ea2db9bf','4b4776de-1afa-413e-a0f9-e498ee5c7982','AZEB ABU',NULL,NULL,NULL,NULL,'0969334847',NULL,'2026-09-09 13:20:50','2026-09-09 13:20:50'),('d9a6b7a6-91db-4b2f-9a84-b759dade7120','5a3a33f1-85fc-4d55-b1c4-e15da227f290','ASHENAFI BEKELE',NULL,NULL,NULL,NULL,'0929354528',NULL,'2026-09-09 13:52:46','2026-09-09 13:52:46'),('dc168888-401e-4281-9712-45bdf5516d44','40789668-76a3-4194-91e4-93f1166b732b','ALEMSARE WOLEDE',NULL,NULL,NULL,NULL,'0914357503',NULL,'2026-09-09 16:26:25','2026-09-09 16:26:25'),('dcc61457-f262-4011-9a4a-7de1c5f1a928','5a87b252-9cb1-4451-b4ab-8f5d50867685','KIDEST MEBTA',NULL,NULL,NULL,NULL,'0913389705',NULL,'2026-09-10 12:19:45','2026-09-10 12:19:45'),('de8031be-2360-4837-b3d1-d764f7efdb68','3cf96762-7ae3-4470-af2b-857c99159a84','DEJE AMARE',NULL,NULL,NULL,NULL,'0974506496',NULL,'2026-09-10 10:08:08','2026-09-10 10:08:08'),('e0f719b9-1543-4a60-b141-eb9a2cb71eab','cdd7702f-480d-4f69-b68d-fca7344d493e','EDEN DAMTE',NULL,NULL,NULL,NULL,'0934557768',NULL,'2026-09-09 13:16:53','2026-09-09 13:16:53'),('e5967d51-9ea4-4637-b1cf-7245d026ec91','ceec09bf-3ab2-4625-b1f3-e04a8727e13c','SEYFE ALEMU',NULL,NULL,NULL,NULL,'0911158246',NULL,'2026-09-10 12:17:00','2026-09-10 12:17:00'),('e5ec26c6-abea-4ed6-b114-2f75e0fa0aa0','348d0db5-c8dc-4630-b17c-924bcc5ded93','MASRESHA GESESE',NULL,NULL,NULL,NULL,'0912042308',NULL,'2026-09-10 12:23:09','2026-09-10 12:23:09'),('e73ed5b2-5de3-41ce-929a-7230b0698b8b','c11b3152-8933-4933-809f-e5689a41077c','MULU TSEGA',NULL,NULL,NULL,NULL,'0920605819',NULL,'2026-09-09 12:19:17','2026-09-09 12:19:17'),('e861313d-6b29-44c0-836a-3f6eecfeee95','3a783381-eb38-4680-ba13-be1f4034b47d','BIRHANU TAYE',NULL,'06','30','502','0912875448',NULL,'2026-09-08 15:10:16','2026-09-08 15:10:16'),('ecbec9d9-fb33-48ab-8fa4-ca762646b384','e9ff7367-3f84-47e7-bdbb-a672ea1f1bb0','ALEME ESHETU','ADDIS KETEMA','06','30','502','0969013377',NULL,'2026-09-08 15:14:43','2026-09-08 15:14:43'),('ee590bff-4779-4806-af1c-6cf19f47478b','710a9ba7-75b2-4f4b-a0a7-c84f0539d75c','GASHAW TESFAW',NULL,NULL,NULL,NULL,'0932144317',NULL,'2026-09-10 08:37:29','2026-09-10 08:37:29'),('ee9576c9-2496-4728-b17b-f07454428047','7eca5692-46d3-4f81-bfa8-9ac5af1613e3','GIZE KETERE',NULL,NULL,NULL,NULL,'0912010948',NULL,'2026-09-09 17:00:25','2026-09-09 17:00:25'),('f072c664-b256-45c5-adfd-4ae10717b061','e3a6d8b7-13a2-472c-950b-63fc8de1a6d5','DENKNESH BUSHA',NULL,NULL,NULL,NULL,'0949118686',NULL,'2026-09-10 10:29:32','2026-09-10 10:29:32'),('f073e924-a014-483b-be84-c0f5cde935c7','a8e3e83d-f32d-4e51-8e2f-2a02d3adfa7d','NAREDOS TADELE','ADDIS KETEMA','02',NULL,'10','+251928054462',NULL,'2026-09-08 14:00:20','2026-09-08 14:00:20'),('f1bc3a50-d2c4-40ea-80c2-dc2e9c0dd632','5cbddaa1-2df2-4617-a8e7-199f65ae89ba','BELETU RETA',NULL,NULL,NULL,NULL,'0906008878',NULL,'2026-09-10 08:34:04','2026-09-10 08:34:04'),('f2e4e766-c47c-44ff-9875-ddd268ab3670','907adecd-706b-4d81-bf4d-f02c4598e487','G/SILASE',NULL,NULL,NULL,NULL,'0911887396',NULL,'2026-09-10 08:29:56','2026-09-10 08:29:56'),('f4bd1d6b-41b4-4e4d-b6f7-c3dd83559805','2852a107-bc21-4f5a-bc4a-71c1ce965132','AYELECH KEBEDE',NULL,NULL,NULL,NULL,'0910494745',NULL,'2026-09-09 14:25:16','2026-09-09 14:25:16'),('f813ca10-d29c-4a2a-b9b5-1b1853f0cc88','7838f795-41cf-438a-a360-3b5ed451c9d3','ALEME ESHETU',NULL,NULL,NULL,NULL,'0969013377',NULL,'2026-09-08 15:04:19','2026-09-08 15:04:19'),('facb49e7-1d28-458d-808f-dba9579b7319','08b34078-fc63-4367-bfd9-0f4f8141e3b1','ESKEDAR BIRHANU',NULL,NULL,NULL,'502','091102 8181',NULL,'2026-09-08 14:57:05','2026-09-08 14:57:05');
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
  `fee_payment_method` enum('DEDUCT_FROM_LOAN','OUT_OF_POCKET') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fee_receipt_number` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fee_receipt_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gross_disbursement_amount` decimal(18,2) DEFAULT NULL,
  `total_upfront_fee_amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `net_disbursement_amount` decimal(18,2) DEFAULT NULL,
  `fee_collection_status` enum('PENDING','COLLECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `fees_collected_at` datetime DEFAULT NULL,
  `fees_collected_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_charge_ledger_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_escrow_status` enum('PENDING','HELD','RECOGNIZED','UTILIZED','NOT_APPLICABLE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `insurance_held_ledger_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_resolution_ledger_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_claim_made` tinyint(1) DEFAULT NULL,
  `insurance_closure_reason` text COLLATE utf8mb4_unicode_ci,
  `loan_closed_at` datetime DEFAULT NULL,
  `loan_closed_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `closure_idempotency_key` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purpose_description` text COLLATE utf8mb4_unicode_ci,
  `repayment_frequency` enum('MONTHLY','WEEKLY','QUARTERLY') COLLATE utf8mb4_unicode_ci DEFAULT 'MONTHLY',
  `workflow_status` enum('PENDING','UNDER_REVIEW','APPROVED','REJECTED','CLOSED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
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
  UNIQUE KEY `uq_loan_closure_idempotency` (`closure_idempotency_key`),
  KEY `fk_loan_product` (`product_code`),
  KEY `idx_loans_member` (`member_id`),
  KEY `idx_loans_next_payment` (`next_payment_date`),
  KEY `idx_loan_selected_tier` (`selected_tier_id`),
  KEY `fk_loan_created_by` (`created_by_user_id`),
  KEY `fk_loan_latest_eligibility` (`latest_eligibility_evaluation_id`),
  KEY `fk_loan_fee_collector` (`fees_collected_by`),
  KEY `fk_loan_service_charge_ledger` (`service_charge_ledger_id`),
  KEY `fk_loan_insurance_held_ledger` (`insurance_held_ledger_id`),
  KEY `fk_loan_insurance_resolution_ledger` (`insurance_resolution_ledger_id`),
  KEY `fk_loan_closer` (`loan_closed_by`),
  CONSTRAINT `fk_loan_closer` FOREIGN KEY (`loan_closed_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_loan_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_loan_fee_collector` FOREIGN KEY (`fees_collected_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_loan_insurance_held_ledger` FOREIGN KEY (`insurance_held_ledger_id`) REFERENCES `sacco_master_ledger` (`ledger_id`),
  CONSTRAINT `fk_loan_insurance_resolution_ledger` FOREIGN KEY (`insurance_resolution_ledger_id`) REFERENCES `sacco_master_ledger` (`ledger_id`),
  CONSTRAINT `fk_loan_latest_eligibility` FOREIGN KEY (`latest_eligibility_evaluation_id`) REFERENCES `loan_eligibility_evaluations` (`evaluation_id`),
  CONSTRAINT `fk_loan_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  CONSTRAINT `fk_loan_product` FOREIGN KEY (`product_code`) REFERENCES `loan_products` (`product_code`),
  CONSTRAINT `fk_loan_selected_tier` FOREIGN KEY (`selected_tier_id`) REFERENCES `loan_product_tiers` (`tier_id`),
  CONSTRAINT `fk_loan_service_charge_ledger` FOREIGN KEY (`service_charge_ledger_id`) REFERENCES `sacco_master_ledger` (`ledger_id`)
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
INSERT INTO `loan_insurance_rate_matrix` VALUES ('1f2450dc-a588-11f1-b78d-c69b1a498638',18,45,1,12,'SINGLE',1.50,1.50,'2.5.3.1 ሀ'),('1f2453cd-a588-11f1-b78d-c69b1a498638',18,45,1,12,'MARRIED',1.95,1.95,'2.5.3.1 ሀ'),('1f2454bd-a588-11f1-b78d-c69b1a498638',18,45,13,60,'SINGLE',1.75,1.75,'2.5.3.1 ለ'),('1f24552a-a588-11f1-b78d-c69b1a498638',18,45,13,60,'MARRIED',2.30,2.30,'2.5.3.1 ለ'),('1f24558e-a588-11f1-b78d-c69b1a498638',18,45,61,120,'SINGLE',2.05,2.05,'2.5.3.1 ሐ'),('1f2455eb-a588-11f1-b78d-c69b1a498638',18,45,61,120,'MARRIED',2.80,2.80,'2.5.3.1 ሐ'),('1f245656-a588-11f1-b78d-c69b1a498638',46,60,1,12,'SINGLE',1.95,1.95,'2.5.3.1 መ'),('1f2456bb-a588-11f1-b78d-c69b1a498638',46,60,1,12,'MARRIED',2.55,2.55,'2.5.3.1 መ'),('1f245716-a588-11f1-b78d-c69b1a498638',46,60,13,60,'SINGLE',2.05,2.05,'2.5.3.1 ሠ'),('1f245770-a588-11f1-b78d-c69b1a498638',46,60,13,60,'MARRIED',2.85,2.85,'2.5.3.1 ሠ'),('1f2457c6-a588-11f1-b78d-c69b1a498638',46,60,61,120,'SINGLE',2.50,2.50,'2.5.3.1 ረ'),('1f24581d-a588-11f1-b78d-c69b1a498638',46,60,61,120,'MARRIED',3.30,3.30,'2.5.3.1 ረ'),('1f245885-a588-11f1-b78d-c69b1a498638',61,NULL,1,12,'SINGLE',2.50,2.50,'2.5.3.1 ሰ'),('1f2458e7-a588-11f1-b78d-c69b1a498638',61,NULL,1,12,'MARRIED',3.30,3.30,'2.5.3.1 ሰ'),('1f245956-a588-11f1-b78d-c69b1a498638',61,NULL,13,60,'SINGLE',2.60,2.60,'2.5.3.1 ሸ'),('1f2459b3-a588-11f1-b78d-c69b1a498638',61,NULL,13,60,'MARRIED',3.50,3.50,'2.5.3.1 ሸ'),('1f245a0c-a588-11f1-b78d-c69b1a498638',61,NULL,61,120,'SINGLE',2.80,2.80,'2.5.3.1 ቀ'),('1f245a5f-a588-11f1-b78d-c69b1a498638',61,NULL,61,120,'MARRIED',3.80,3.80,'2.5.3.1 ቀ');
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
INSERT INTO `loan_product_tiers` VALUES ('4044cf40-1b5c-40d0-844e-d283b1fd3b40','2-YEAR','DEFAULT','2 YEAR',1,3,50000.00,7000000.00,24,14.00,20.00,10.00,1,'2026-09-01 09:44:12','2026-09-01 09:44:12'),('41000000-0000-4000-8000-000000000001','TIER-1','STD-01','Standard Tier 1',1,3,0.00,100000.00,24,14.00,10.00,10.00,1,'2026-08-31 22:05:48','2026-08-31 22:05:48'),('41000000-0000-4000-8000-000000000002','TIER-1','STD-02','Standard Tier 2',2,4,100001.00,200000.00,48,15.50,10.00,10.00,1,'2026-08-31 22:05:48','2026-08-31 22:05:48'),('41000000-0000-4000-8000-000000000003','TIER-1','STD-03','Standard Tier 3',3,5,200001.00,400000.00,48,15.50,10.00,10.00,1,'2026-08-31 22:05:48','2026-08-31 22:05:48'),('41000000-0000-4000-8000-000000000004','TIER-1','STD-04','Standard Tier 4',4,6,400001.00,1000000.00,48,15.50,20.00,10.00,1,'2026-08-31 22:05:48','2026-08-31 22:05:48'),('41000000-0000-4000-8000-000000000005','TIER-1','STD-05','Standard Tier 5',5,7,1000001.00,1500000.00,60,16.50,20.00,10.00,1,'2026-08-31 22:05:48','2026-08-31 22:05:48'),('41000000-0000-4000-8000-000000000006','TIER-1','STD-06','Standard Tier 6',6,8,1500001.00,2500000.00,60,16.50,30.00,10.00,1,'2026-08-31 22:05:48','2026-08-31 22:05:48'),('41000000-0000-4000-8000-000000000007','TIER-1','STD-07','Standard Tier 7',7,9,2500001.00,3500000.00,60,16.50,30.00,10.00,1,'2026-08-31 22:05:48','2026-08-31 22:05:48'),('41000000-0000-4000-8000-000000000008','TIER-1','STD-08','Standard Tier 8',8,10,3500001.00,7000000.00,96,17.00,35.00,15.00,1,'2026-08-31 22:05:48','2026-08-31 22:05:48'),('41000000-0000-4000-8000-000000000009','TIER-9','VEH-01','Vehicle Purchase Tier',1,3,0.00,3500000.00,60,16.50,50.00,10.00,1,'2026-08-31 22:05:48','2026-08-31 22:05:48'),('41000000-0000-4000-8000-000000000010','TIER-10','HOU-01','House Purchase Tier',1,4,0.00,7000000.00,96,17.00,45.00,15.00,1,'2026-08-31 22:05:48','2026-08-31 22:05:48');
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
INSERT INTO `loan_products` VALUES ('2-YEAR','TWO YEAR LOAN',14.00,'DECLINING',1,24,10.00,1,'PERCENT',0.00,1,0,0.00,'PERCENT',4.00,0.00,'2026-09-01 09:44:12',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),('TIER-1','Standard Policy Loan',14.00,'DECLINING',1,96,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-31 22:05:47',NULL,3,0.00,100000.00,10.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-10','House Purchase Loan',17.00,'DECLINING',1,96,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-31 22:05:47',NULL,4,0.00,7000000.00,45.00,15.00,1,'HOUSING','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-2','Standard Loan - Tier 2',15.50,'DECLINING',1,48,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-31 22:05:47',NULL,4,100001.00,200000.00,10.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-3','Standard Loan - Tier 3',15.50,'DECLINING',1,48,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-31 22:05:47',NULL,5,200001.00,400000.00,10.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-4','Standard Loan - Tier 4',15.50,'DECLINING',1,48,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-31 22:05:47',NULL,6,400001.00,1000000.00,20.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-5','Standard Loan - Tier 5',16.50,'DECLINING',1,60,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-31 22:05:47',NULL,7,1000001.00,1500000.00,20.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-6','Standard Loan - Tier 6',16.50,'DECLINING',1,60,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-31 22:05:47',NULL,8,1500001.00,2500000.00,30.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-7','Standard Loan - Tier 7',16.50,'DECLINING',1,60,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-31 22:05:47',NULL,9,2500001.00,3500000.00,30.00,10.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-8','Standard Loan - Tier 8',17.00,'DECLINING',1,96,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-31 22:05:47',NULL,10,3500001.00,7000000.00,35.00,15.00,0,'STANDARD','SAV_COMPULSORY,SAV_VOLUNTARY'),('TIER-9','Vehicle Purchase Loan',16.50,'DECLINING',1,60,2.00,0,'PERCENT',0.00,0,0,0.00,'PERCENT',0.00,0.00,'2026-08-31 22:05:47',NULL,3,0.00,3500000.00,50.00,10.00,1,'VEHICLE','SAV_COMPULSORY,SAV_VOLUNTARY');
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
INSERT INTO `loan_tier_eligible_account_products` VALUES ('4044cf40-1b5c-40d0-844e-d283b1fd3b40','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000001','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000002','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000003','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000004','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000005','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000006','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000007','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000008','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000009','SAV_COMPULSORY'),('41000000-0000-4000-8000-000000000010','SAV_COMPULSORY');
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
INSERT INTO `member_documents` VALUES ('0169c9fa-2bd9-4444-9b2b-f3a42f0c77cc','e033d589-00ae-4989-a945-922f99bf6ca1','KEBELE_ID',NULL,'/uploads/member-documents/e033d589-00ae-4989-a945-922f99bf6ca1/1788958227992-181405889.jpeg',NULL,0,NULL,NULL,'2026-09-09 12:50:29','2026-09-09 12:50:29'),('0250388c-223e-4d0e-ae06-1709ba2273e4','6c1309a3-c4d6-479e-847d-b078d7905d70','KEBELE_ID',NULL,'/uploads/member-documents/6c1309a3-c4d6-479e-847d-b078d7905d70/1788874535822-191792618.jpeg',NULL,0,NULL,NULL,'2026-09-08 13:35:41','2026-09-08 13:35:41'),('0d3ad92a-61e6-4ccd-bc2f-0344364ce25c','348d0db5-c8dc-4630-b17c-924bcc5ded93','KEBELE_ID',NULL,'/uploads/member-documents/348d0db5-c8dc-4630-b17c-924bcc5ded93/1789043009344-426266359.jpeg',NULL,0,NULL,NULL,'2026-09-10 12:23:29','2026-09-10 12:23:29'),('0fd8dbf7-5df8-4d79-beb2-1849767960b1','35540088-1f1f-4e9e-86fc-79104fbb3f25','KEBELE_ID',NULL,'/uploads/member-documents/35540088-1f1f-4e9e-86fc-79104fbb3f25/1789028380103-83487534.jpeg',NULL,0,NULL,NULL,'2026-09-10 08:19:40','2026-09-10 08:19:40'),('1094e421-e13b-4ac4-87b3-4edf756cf9b4','fd245c91-605f-4955-ae7e-56058ddc3a7d','KEBELE_ID',NULL,'/uploads/member-documents/fd245c91-605f-4955-ae7e-56058ddc3a7d/1789041300092-891321237.jpeg',NULL,0,NULL,NULL,'2026-09-10 11:55:00','2026-09-10 11:55:00'),('1c3fa568-b01e-4731-ae27-1805b621ee46','710a9ba7-75b2-4f4b-a0a7-c84f0539d75c','KEBELE_ID',NULL,'/uploads/member-documents/710a9ba7-75b2-4f4b-a0a7-c84f0539d75c/1789029470282-816452816.jpeg',NULL,0,NULL,NULL,'2026-09-10 08:37:51','2026-09-10 08:37:51'),('26db067f-6627-4497-a13a-35d194f22ced','08f0703b-6290-449d-8415-1db0a51c6c45','KEBELE_ID',NULL,'/uploads/member-documents/08f0703b-6290-449d-8415-1db0a51c6c45/1788869261580-488480689.jpeg',NULL,0,NULL,NULL,'2026-09-08 12:07:48','2026-09-08 12:07:48'),('2a4f6ae1-596f-4136-b1ad-20056c17a6ec','08f0703b-6290-449d-8415-1db0a51c6c45','KEBELE_ID',NULL,NULL,'/uploads/member-documents/08f0703b-6290-449d-8415-1db0a51c6c45/1788869281873-372887186.jpeg',0,NULL,NULL,'2026-09-08 12:08:08','2026-09-08 12:08:08'),('2dc09791-c08b-442e-a0cb-4790a6593e1f','03546121-ca8a-4426-9300-dba2ab4e4994','KEBELE_ID',NULL,'/uploads/member-documents/03546121-ca8a-4426-9300-dba2ab4e4994/1788972276015-568494375.jpeg',NULL,0,NULL,NULL,'2026-09-09 16:44:39','2026-09-09 16:44:39'),('3b4b8c9c-6b95-4ece-b5dd-f6b1347b7e3d','593e199b-b6df-4898-91b7-3e00e263c119','KEBELE_ID',NULL,'/uploads/member-documents/593e199b-b6df-4898-91b7-3e00e263c119/1788872733015-994770942.jpeg',NULL,0,NULL,NULL,'2026-09-08 13:05:34','2026-09-08 13:05:34'),('4015a9f3-b2da-419c-986b-e1fb590bcd34','2bc3e407-014a-4af5-994d-6e00e9669495','KEBELE_ID',NULL,'/uploads/member-documents/2bc3e407-014a-4af5-994d-6e00e9669495/1789028838025-397535902.jpeg',NULL,0,NULL,NULL,'2026-09-10 08:27:18','2026-09-10 08:27:18'),('429ecb99-49ce-46e7-87ac-8879648c1dae','44f945ac-6933-4973-9d61-b4297b419889','KEBELE_ID',NULL,'/uploads/member-documents/44f945ac-6933-4973-9d61-b4297b419889/1788871299755-927107524.jpeg',NULL,0,NULL,NULL,'2026-09-08 12:41:42','2026-09-08 12:41:42'),('44bd6f8a-a4ed-43be-a492-55ac43300950','f9d812a0-eff4-4a37-a454-6a13c0b185a1','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/f9d812a0-eff4-4a37-a454-6a13c0b185a1/1789572855116-989900562.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:34:21','2026-09-16 15:34:21'),('467fa8f1-234c-43a2-be4c-5c43d38442c4','c11b3152-8933-4933-809f-e5689a41077c','KEBELE_ID',NULL,'/uploads/member-documents/c11b3152-8933-4933-809f-e5689a41077c/1788956410658-180990837.jpeg',NULL,0,NULL,NULL,'2026-09-09 12:20:11','2026-09-09 12:20:11'),('48413f5d-bc6c-4133-b03a-78281934ae6c','907adecd-706b-4d81-bf4d-f02c4598e487','KEBELE_ID',NULL,'/uploads/member-documents/907adecd-706b-4d81-bf4d-f02c4598e487/1789029014156-757454874.jpeg',NULL,0,NULL,NULL,'2026-09-10 08:30:14','2026-09-10 08:30:14'),('4b1e747c-8d08-495d-9b6d-7624698e63db','5a3a33f1-85fc-4d55-b1c4-e15da227f290','KEBELE_ID',NULL,'/uploads/member-documents/5a3a33f1-85fc-4d55-b1c4-e15da227f290/1788961992057-199392971.jpeg',NULL,0,NULL,NULL,'2026-09-09 13:53:13','2026-09-09 13:53:13'),('4de94b9e-0d5b-429d-8298-117bc77582ba','e64135b5-1f0e-4236-bc89-ee1e65b71f3f','KEBELE_ID',NULL,'/uploads/member-documents/e64135b5-1f0e-4236-bc89-ee1e65b71f3f/1788972566086-28631866.jpeg',NULL,0,NULL,NULL,'2026-09-09 16:49:27','2026-09-09 16:49:27'),('4e5f88a4-fbb2-496f-828f-5c17ed6f991c','5a87b252-9cb1-4451-b4ab-8f5d50867685','KEBELE_ID',NULL,'/uploads/member-documents/5a87b252-9cb1-4451-b4ab-8f5d50867685/1789042814476-596530210.jpeg',NULL,0,NULL,NULL,'2026-09-10 12:20:15','2026-09-10 12:20:15'),('53c76b93-bb71-4947-af89-fab03b835e16','9745b5fa-423b-4e90-bb15-79dffa205cb5','KEBELE_ID',NULL,'/uploads/member-documents/9745b5fa-423b-4e90-bb15-79dffa205cb5/1789033645969-848749624.jpeg',NULL,0,NULL,NULL,'2026-09-10 09:47:26','2026-09-10 09:47:26'),('5fff5bbb-0dd0-4acc-a7ef-736d71143646','08f0703b-6290-449d-8415-1db0a51c6c45','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/08f0703b-6290-449d-8415-1db0a51c6c45/1789571006305-73288977.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:03:28','2026-09-16 15:03:28'),('743f3b74-db05-403f-a27b-8ae1986d2ab6','3bcc492c-4391-4639-96b6-203f809f31a1','KEBELE_ID',NULL,'/uploads/member-documents/3bcc492c-4391-4639-96b6-203f809f31a1/1788974043543-344932606.jpeg',NULL,0,NULL,NULL,'2026-09-09 17:14:04','2026-09-09 17:14:04'),('751ad87f-8496-4427-a97e-baacfe10b4f7','5cbddaa1-2df2-4617-a8e7-199f65ae89ba','KEBELE_ID',NULL,'/uploads/member-documents/5cbddaa1-2df2-4617-a8e7-199f65ae89ba/1789029287257-559589525.jpeg',NULL,0,NULL,NULL,'2026-09-10 08:34:48','2026-09-10 08:34:48'),('7b04d05e-5509-43eb-966b-0c1eacae1971','53d62144-8ccd-475e-9aec-a159785f628d','KEBELE_ID',NULL,'/uploads/member-documents/53d62144-8ccd-475e-9aec-a159785f628d/1789034770032-298079145.jpeg',NULL,0,NULL,NULL,'2026-09-10 10:06:10','2026-09-10 10:06:10'),('819637ed-1eb0-480e-8305-83870ab7fdf4','ad6218e0-5708-4e21-90cc-878b02064836','KEBELE_ID',NULL,'/uploads/member-documents/ad6218e0-5708-4e21-90cc-878b02064836/1789040873585-75271299.jpeg',NULL,0,NULL,NULL,'2026-09-10 11:47:54','2026-09-10 11:47:54'),('83f56b35-934f-416a-af07-f3840f7a93df','26c0f9ca-ac0a-4a1b-a064-99aff20ba32d','KEBELE_ID',NULL,'/uploads/member-documents/26c0f9ca-ac0a-4a1b-a064-99aff20ba32d/1789041010150-498264181.jpeg',NULL,0,NULL,NULL,'2026-09-10 11:50:10','2026-09-10 11:50:10'),('847c5d1e-eff1-4351-b300-8c924939033f','b38514bb-791c-4474-94c0-ef608f20e944','KEBELE_ID',NULL,'/uploads/member-documents/b38514bb-791c-4474-94c0-ef608f20e944/1788974856980-323923820.jpeg',NULL,0,NULL,NULL,'2026-09-09 17:27:37','2026-09-09 17:27:37'),('8a327d13-3ba2-416c-811d-6aa0856371b2','6c1309a3-c4d6-479e-847d-b078d7905d70','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/6c1309a3-c4d6-479e-847d-b078d7905d70/1789572360109-332254005.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:26:17','2026-09-16 15:26:17'),('8fdf084a-a272-4f8a-bd93-40049be5d1d2','ef8d58bc-3ed0-4d28-8ce4-ebc60cc1bc1d','KEBELE_ID',NULL,'/uploads/member-documents/ef8d58bc-3ed0-4d28-8ce4-ebc60cc1bc1d/1789041489831-87985290.jpeg',NULL,0,NULL,NULL,'2026-09-10 11:58:10','2026-09-10 11:58:10'),('915c5d74-34f8-4d51-b89f-7354a9f5d6a1','1bee65a1-40c4-4d18-b5c4-c282d38275c5','KEBELE_ID',NULL,'/uploads/member-documents/1bee65a1-40c4-4d18-b5c4-c282d38275c5/1788872287673-410079077.jpeg',NULL,0,NULL,NULL,'2026-09-08 12:58:09','2026-09-08 12:58:09'),('91a05fe4-130a-4e4a-b25e-9a82d5a60012','a3c75b02-a9d6-4552-983e-4846681292ed','KEBELE_ID',NULL,'/uploads/member-documents/a3c75b02-a9d6-4552-983e-4846681292ed/1789035031891-20365072.jpeg',NULL,0,NULL,NULL,'2026-09-10 10:10:32','2026-09-10 10:10:32'),('97b191fb-fcef-47af-9922-a2e63035b003','a8e3e83d-f32d-4e51-8e2f-2a02d3adfa7d','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/a8e3e83d-f32d-4e51-8e2f-2a02d3adfa7d/1789572771260-818677589.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:33:04','2026-09-16 15:33:04'),('9955fe2c-0636-4123-a6f6-01794343627e','9fd14da0-5691-4045-8085-b69571eadf1f','KEBELE_ID',NULL,'/uploads/member-documents/9fd14da0-5691-4045-8085-b69571eadf1f/1788973508409-72050834.jpeg',NULL,0,NULL,NULL,'2026-09-09 17:05:21','2026-09-09 17:05:21'),('99ba4f16-1528-467a-acc9-30d5a54b7763','9c4a5afe-890d-4e53-a5ae-d092f4d303d4','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/9c4a5afe-890d-4e53-a5ae-d092f4d303d4/1789572650842-917701704.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:30:59','2026-09-16 15:30:59'),('a598719b-8bff-4e75-be7e-ef0e35ddb7d7','7eca5692-46d3-4f81-bfa8-9ac5af1613e3','KEBELE_ID',NULL,'/uploads/member-documents/7eca5692-46d3-4f81-bfa8-9ac5af1613e3/1788973285181-131283743.jpeg',NULL,0,NULL,NULL,'2026-09-09 17:01:25','2026-09-09 17:01:25'),('a760dc51-3eb7-4eb3-aece-87f1062531ed','ceec09bf-3ab2-4625-b1f3-e04a8727e13c','KEBELE_ID',NULL,'/uploads/member-documents/ceec09bf-3ab2-4625-b1f3-e04a8727e13c/1789042644526-589236984.jpeg',NULL,0,NULL,NULL,'2026-09-10 12:17:25','2026-09-10 12:17:25'),('abda668b-c9e9-4139-bfe3-8fa822035b2f','62f48de4-6dee-48a8-8ec5-077d7157d201','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/62f48de4-6dee-48a8-8ec5-077d7157d201/1789572112723-795553621.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:22:02','2026-09-16 15:22:02'),('accdc96a-4805-4da6-95c2-d366ba7b9d7e','192b7726-b9ff-4907-93cd-a03140224321','KEBELE_ID',NULL,'/uploads/member-documents/192b7726-b9ff-4907-93cd-a03140224321/1789029656795-799988696.jpeg',NULL,0,NULL,NULL,'2026-09-10 08:40:57','2026-09-10 08:40:57'),('b1aa844f-b078-420f-ba84-6c8066040bf6','f5b59e3f-80e8-42fb-913f-dfeb464c01e6','KEBELE_ID',NULL,'/uploads/member-documents/f5b59e3f-80e8-42fb-913f-dfeb464c01e6/1789033897290-174049617.jpeg',NULL,0,NULL,NULL,'2026-09-10 09:51:38','2026-09-10 09:51:38'),('c02dbc18-07ab-4b1d-bdf5-15e43caadc18','f9d812a0-eff4-4a37-a454-6a13c0b185a1','KEBELE_ID',NULL,'/uploads/member-documents/f9d812a0-eff4-4a37-a454-6a13c0b185a1/1788876425353-708233696.jpeg',NULL,0,NULL,NULL,'2026-09-08 14:07:08','2026-09-08 14:07:08'),('c249d835-e61d-47df-8a45-3cbf78087822','d504bb2b-711a-463a-bcda-7c504ea82b2e','KEBELE_ID',NULL,'/uploads/member-documents/d504bb2b-711a-463a-bcda-7c504ea82b2e/1788879151277-778280379.jpeg',NULL,0,NULL,NULL,'2026-09-08 14:52:32','2026-09-08 14:52:32'),('c76f31a0-081e-4dd3-9eb0-05f9212e6aa6','b249b8b2-cc5a-41ea-8d13-976ee69a5080','KEBELE_ID',NULL,'/uploads/member-documents/b249b8b2-cc5a-41ea-8d13-976ee69a5080/1789036718268-456158474.jpeg',NULL,0,NULL,NULL,'2026-09-10 10:38:39','2026-09-10 10:38:39'),('c90a721d-61ea-44e6-afd5-fc7fed32178f','e3762222-c40e-491d-bd8c-6aa7a1fbb567','KEBELE_ID',NULL,'/uploads/member-documents/e3762222-c40e-491d-bd8c-6aa7a1fbb567/1789028558378-654001755.jpeg',NULL,0,NULL,NULL,'2026-09-10 08:22:38','2026-09-10 08:22:38'),('cc520a9a-7c7a-4ed9-93a2-003056ea41d5','44f945ac-6933-4973-9d61-b4297b419889','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/44f945ac-6933-4973-9d61-b4297b419889/1789571462623-230654676.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:11:05','2026-09-16 15:11:05'),('cd24d080-931b-4656-bf83-f6fe4965560c','b6836deb-7d87-4bdc-b4a3-fdcdab80e9c8','KEBELE_ID',NULL,'/uploads/member-documents/b6836deb-7d87-4bdc-b4a3-fdcdab80e9c8/1788880913932-306195987.jpeg',NULL,0,NULL,NULL,'2026-09-08 15:21:55','2026-09-08 15:21:55'),('cfb72852-ff56-4875-87b1-e469e94acfa5','b9b6e2d7-a7f4-464a-b852-7b62f5878663','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/b9b6e2d7-a7f4-464a-b852-7b62f5878663/1789572538856-391373540.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:29:11','2026-09-16 15:29:11'),('d34edf31-1b2e-4951-9dff-8755e528398f','79b6c42e-6d0a-486a-b7c6-472be5b0e8c2','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/79b6c42e-6d0a-486a-b7c6-472be5b0e8c2/1789571337486-505997806.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:09:01','2026-09-16 15:09:01'),('d82ec136-91c9-438c-9da3-1059d3f3b417','608a3826-b684-4417-a37f-4017c75b55d0','KEBELE_ID',NULL,'/uploads/member-documents/608a3826-b684-4417-a37f-4017c75b55d0/1788882442259-452245030.jpeg',NULL,0,NULL,NULL,'2026-09-08 15:47:24','2026-09-08 15:47:24'),('dca92e2c-f9f2-4982-aadd-62e6e4d79a6c','b9b6e2d7-a7f4-464a-b852-7b62f5878663','KEBELE_ID',NULL,'/uploads/member-documents/b9b6e2d7-a7f4-464a-b852-7b62f5878663/1788874895530-367031970.jpeg',NULL,0,NULL,NULL,'2026-09-08 13:41:37','2026-09-08 13:41:37'),('e6184473-a155-4f53-ae91-ff180ee145ed','40789668-76a3-4194-91e4-93f1166b732b','KEBELE_ID',NULL,'/uploads/member-documents/40789668-76a3-4194-91e4-93f1166b732b/1788971225098-367032702.jpeg',NULL,0,NULL,NULL,'2026-09-09 16:27:07','2026-09-09 16:27:07'),('e9501ada-4643-4b85-8dd6-46695e55b0ae','b6d36e13-ec2d-426b-ab6d-a540fc74c91e','KEBELE_ID',NULL,'/uploads/member-documents/b6d36e13-ec2d-426b-ab6d-a540fc74c91e/1788970593723-920386798.jpeg',NULL,0,NULL,NULL,'2026-09-09 16:16:35','2026-09-09 16:16:35'),('ec9d8730-fc96-4c28-8a42-786d47d17a13','1bee65a1-40c4-4d18-b5c4-c282d38275c5','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/1bee65a1-40c4-4d18-b5c4-c282d38275c5/1789571545393-114424307.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:12:28','2026-09-16 15:12:28'),('ee20c3b0-54e5-4556-96ba-7b631e8267b5','beb99821-29c5-4e2a-b280-2d5c8aa32c8d','KEBELE_ID',NULL,'/uploads/member-documents/beb99821-29c5-4e2a-b280-2d5c8aa32c8d/1789042130047-575068722.jpeg',NULL,0,NULL,NULL,'2026-09-10 12:08:50','2026-09-10 12:08:50'),('ef668192-4a85-4dda-a15f-0ba80e3a2b61','b88df60c-58e3-424a-92a1-6b57933f6485','KEBELE_ID',NULL,'/uploads/member-documents/b88df60c-58e3-424a-92a1-6b57933f6485/1788876952587-337172239.jpeg',NULL,0,NULL,NULL,'2026-09-08 14:15:54','2026-09-08 14:15:54'),('f36555ff-2446-496d-b074-9243778f16b4','fabc1046-8283-4729-889c-e3903e6db85e','KEBELE_ID',NULL,'/uploads/member-documents/fabc1046-8283-4729-889c-e3903e6db85e/1788958489045-131856074.jpeg',NULL,0,NULL,NULL,'2026-09-09 12:54:51','2026-09-09 12:54:51'),('f73e92e2-53c2-4278-aa4d-4f6ab71f037c','593e199b-b6df-4898-91b7-3e00e263c119','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/593e199b-b6df-4898-91b7-3e00e263c119/1789572038442-882198235.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:20:42','2026-09-16 15:20:42'),('fae5ef34-0d89-4a65-9f84-78496156aebe','502dd89b-159e-4fd0-804a-58d1963e9ac6','REGISTRATION_RECEIPT',NULL,'/uploads/member-documents/502dd89b-159e-4fd0-804a-58d1963e9ac6/1789572215122-16835115.jpeg',NULL,0,NULL,NULL,'2026-09-16 15:23:47','2026-09-16 15:23:47'),('fb3bbb43-19c0-40ae-8766-25c017a1840c','54dee1ac-d21c-430f-95c0-f5e7425e4cee','KEBELE_ID',NULL,'/uploads/member-documents/54dee1ac-d21c-430f-95c0-f5e7425e4cee/1788958930541-839167219.jpeg',NULL,0,NULL,NULL,'2026-09-09 13:02:12','2026-09-09 13:02:12'),('fde1c1a1-acff-4a6b-af2e-19bd7455d7fb','14db8a32-793d-4e81-a682-183d55a83360','KEBELE_ID',NULL,'/uploads/member-documents/14db8a32-793d-4e81-a682-183d55a83360/1789041965046-680667944.jpeg',NULL,0,NULL,NULL,'2026-09-10 12:06:06','2026-09-10 12:06:06');
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
INSERT INTO `members` VALUES ('017bf1be-3d8f-4a8d-8fe8-a7fed105c685','MEM-1788952898072','BIRUK','TESFAYE','KEBEDE','+251911111116',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:21:38','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$sSe3LMVv2lCRyhZqL5mBQe6gG4D7FFXwGe8U6X0v6wUEnPhxouqoS',NULL,'2026-09-09 11:21:38',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('03546121-ca8a-4426-9300-dba2ab4e4994','MEM-1788972256115','FANTAYE','SISAY','KEBEDE','+251920627691',NULL,'FEMALE','SINGLE',33,0,0,'SECONDARY',NULL,NULL,'KIRKOS','09',NULL,NULL,NULL,0,1,'2026-09-09 16:44:16','336/06','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$7OtXsC.RzTIzhqoJ2Sgk4ubCiu5REb9KqhLED8kqX9dOhecmk8.u6',NULL,'2026-09-09 16:44:16',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('06e9ded4-2b6d-44e2-887d-22c27682d03f','MEM-1788881090917','EYOB','BIRHANU ','H/SILASE','+251900464716',NULL,'MALE','SINGLE',24,3,4,'DEGREE',NULL,NULL,'LEMI KURA','03',NULL,NULL,NULL,0,0,NULL,'10','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$HYO4ggCOfNcbBlyHzXskKeam9rtvOqN.U3YHiYRRTw1VFPShpPSL6',NULL,'2026-09-08 15:24:50',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('0814feff-34cb-4b08-9676-a3a43d31a027','MEM-1789037030888','MELESE','G/TINSAE','K/MARYAM','+251914507751',NULL,'MALE','SINGLE',30,0,0,'SECONDARY',NULL,NULL,'LEDETA','05',NULL,NULL,NULL,0,1,'2026-09-10 10:43:50','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/0814feff-34cb-4b08-9676-a3a43d31a027/1789037053880-633549808.jpeg',NULL,'$2b$12$Bsx92YVcK7MZojZDEdBUDuJ53LyruUFNWWcdqrp7AQzUR3MdIlsvS',NULL,'2026-09-10 10:43:50',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('08b34078-fc63-4367-bfd9-0f4f8141e3b1','MEM-1788879425246','SELAMAWIT','TESFAHUN','TAYE','+251911290123',NULL,'FEMALE','SINGLE',NULL,0,0,'DEGREE',NULL,3,'ADSIS KETMA','06',NULL,NULL,NULL,0,0,NULL,'502','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$8wBSY13s4AsxbdApypIdpu03t3e/uV9o0a0yTzyltwo6sz80IPg/.',NULL,'2026-09-08 14:57:05',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('08f0703b-6290-449d-8415-1db0a51c6c45','MEM-1788869162383','MENBERE','KEMAL','ABDI','+251977626591',NULL,'FEMALE','MARRIED',40,2,1,'PRIMARY','Treader',NULL,'LEMI KURA','14',NULL,NULL,NULL,3,1,'2026-09-08 12:06:02','180/25','SME',16000.00,'000000','ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$rCNuhJZTMdjwTnbm9iXRmerj5wfL66b8z5Khloe2ZsLCJYrfnts4q',NULL,'2026-09-08 12:06:02',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('0920f343-0712-42bc-bbeb-b4ae1d836466','MEM-1788953202562','ASENAKE','ALEMU','KEBEDE','+251911111113',NULL,'MALE','SINGLE',35,0,0,NULL,NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:26:42','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$QEPhT7zNMSbZTQLy.65F2OWRlyw/qMut68Ew2mOP/4v1Eo1anGnTG',NULL,'2026-09-09 11:26:42',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('09341a83-984b-4bb3-923d-9b9f9250a11b','MEM-1788965870643','GUNFA','GURMECHA','DEME','+251988452790',NULL,'MALE','MARRIED',50,2,2,'SECONDARY',NULL,NULL,'ARADA','04',NULL,NULL,NULL,0,1,'2026-09-09 14:57:50','21/45','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/09341a83-984b-4bb3-923d-9b9f9250a11b/1788965920669-991004536.jpeg',NULL,'$2b$12$bGR/MLGw7x2aRdaZezdOce9w8OLRILC9Ti0Q9FLmKk/3kOxHprkOe',NULL,'2026-09-09 14:57:50',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('0b5728a6-6e77-4803-b9f8-4e219a6faa8f','MEM-1788953469106','NUHAMIN','TESFAYE','TADESE','+251911111132',NULL,'FEMALE','SINGLE',30,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,0,NULL,'001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$AvFjYmbkk1vQN1ISheOryuHkhbOXmTOUGbHzSpuJ1Ahp0E.k4.ak.',NULL,'2026-09-09 11:31:09',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('0d874cb9-f99b-40c8-b038-1df415c0c126','MEM-1789034326196','MELKAM','WEDAJE','ALAMEREW','+251989302370',NULL,'FEMALE','SINGLE',27,0,0,'SECONDARY',NULL,NULL,'K.K','04',NULL,NULL,NULL,0,1,'2026-09-10 09:58:46','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/0d874cb9-f99b-40c8-b038-1df415c0c126/1789034348563-206032009.jpeg',NULL,'$2b$12$GJmal1qm3cZeqi33dK7Kw.M8kSagp00YBBjgLheh1rWsD5Fme4X/O',NULL,'2026-09-10 09:58:46',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('0da17060-6e84-4bf9-8978-b00f747dc15c','MEM-1788882795542','MESERET','YEROM','ALTAYE','+251941262397',NULL,'FEMALE','SINGLE',25,1,1,'DEGREE',NULL,3,'YEKA','01',NULL,NULL,NULL,0,1,'2026-09-08 15:53:15','10','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,'/uploads/members/0da17060-6e84-4bf9-8978-b00f747dc15c/1788882857775-328612371.jpeg','$2b$12$YPZ4p5KierrfgCIDfnBmeOX/8D3I6XmAd.NTh7b65rfXxMmN0IW4u',NULL,'2026-09-08 15:53:15',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('10392591-18e4-4de5-b976-7e6b2b968f65','MEM-1788967522950','WORKNEH','SERBESA','KEBEDE','+251940492933',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'YEKA','07',NULL,NULL,NULL,0,1,'2026-09-09 15:25:22','29/30','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/10392591-18e4-4de5-b976-7e6b2b968f65/1788967607241-847912533.jpeg',NULL,'$2b$12$YxUxDD/WO6wzfGKmZoszAO.xVvFxPoM9pOAWuQi8zb9F95rFoSasa',NULL,'2026-09-09 15:25:22',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('10886ad4-baf4-464b-9032-4401b9322390','MEM-1788959253703','BIRUK','DANIEL','KEBEDE','+251922783434',NULL,'MALE','SINGLE',50,0,0,'SECONDARY',NULL,NULL,'ARADA','05',NULL,NULL,NULL,0,1,'2026-09-09 13:07:33','314','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$PnLCvyCvNJ/h9SqFeisdCOk8vQJZbqqg5tWk6uVuhpLA7tHJeD9Pm',NULL,'2026-09-09 13:07:33',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('11284571-9548-49b5-88bb-b4d42c977db8','MEM-1788969213131','GIORGIS','FIKERA','KEBEDE','+251929394830',NULL,'MALE','MARRIED',48,1,2,'SECONDARY',NULL,NULL,'YEKA','07',NULL,NULL,NULL,0,1,'2026-09-09 15:53:33','127','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$ZmuO.CWuED9iaDrael9XbeI8LJDFkA7D1ZYj2UCkIlp9jQNXdnZYC',NULL,'2026-09-09 15:53:33',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('126673bd-4f5c-467f-b654-6fdffa3ad543','MEM-1788970154272','FELEGE ','DESE','KEBEDE','+251934554960',NULL,'FEMALE','SINGLE',29,0,0,'SECONDARY',NULL,NULL,'AKAKI KALITI','05',NULL,NULL,NULL,0,1,'2026-09-09 16:09:14','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/126673bd-4f5c-467f-b654-6fdffa3ad543/1788970175426-751601897.jpeg',NULL,'$2b$12$kM2jyRT7ifTDL2aoCXGeY.AbrhQq.7EyOokcdrYFefd5UR/3zL2O6',NULL,'2026-09-09 16:09:14',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('14db8a32-793d-4e81-a682-183d55a83360','MEM-1789041943918','TESFAYE','AGEZA','BANKASHE','+251915320128',NULL,'MALE','MARRIED',NULL,1,1,'MASTERS',NULL,15,'ADISS KETEMA','41',NULL,NULL,NULL,0,1,'2026-09-10 12:05:43','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$tt3KImFk9WcurzPvBTYqXOKYG6gq7ZzfzXHjO9MCkNVxHbwDyCN.W',NULL,'2026-09-10 12:05:43',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('192b7726-b9ff-4907-93cd-a03140224321','MEM-1789029628346','HAYEMANOT','GETANEH','KEBEDE','+251910555439',NULL,'FEMALE','SINGLE',38,0,0,'SECONDARY',NULL,NULL,'YEKA','02',NULL,NULL,NULL,0,1,'2026-09-10 08:40:28','1124','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$bIkfeGVcO44d6uVSZ5sKWudexA0P4h7Gesf2L7Ix1g7/W9lP3ucba',NULL,'2026-09-10 08:40:28',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('1bee65a1-40c4-4d18-b5c4-c282d38275c5','MEM-1788872265394','ALEMU','BELAY','MEKONNEN','+251900799944',NULL,'MALE','SINGLE',37,0,0,'SECONDARY','DRIVER',14,'LEMI KURA','06',NULL,'ARABSA',NULL,0,0,NULL,'627/16','INDIVIDUAL',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$rpdvPP0UugoGDAI2nEd8BO0oNNIoe.UZBgkOTFFRUKNklvO6USZ9.',NULL,'2026-09-08 12:57:45',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('1c470d20-183e-4c25-9640-6bec5b5db4ca','MEM-1788974598618','FANAYE','TILAHUN','DEMEKE','+251948001826',NULL,'FEMALE','SINGLE',NULL,0,0,NULL,NULL,28,'YEKA','10',NULL,NULL,NULL,0,1,'2026-09-09 17:23:18','ADISS','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,'/uploads/members/1c470d20-183e-4c25-9640-6bec5b5db4ca/1788974630051-971217477.jpeg','$2b$12$L.j8SBSyRcl3Ya8g0i1acOYXpwuliwY9gQChsBdVB8R8tuVv33.Se',NULL,'2026-09-09 17:23:18',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('1c8bd681-cbc7-4824-b2bc-3de9a98613b7','MEM-1788953789592','RAHEL','AREGAY','KEBEDE','+251911111167',NULL,'FEMALE','SINGLE',30,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:36:29','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$9MXQbW25EI.wCFceK79xoO0h2vjfSpHEY7GMNQs8ZKLF6JwrcdfQW',NULL,'2026-09-09 11:36:29',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('208f6539-aef6-428d-9a6b-6ea1bd2605bd','MEM-1788952709944','MESETAWET','TADESE','KEBEDE','+251911111118',NULL,'FEMALE','SINGLE',30,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:18:29','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$leJ6mkA.Faf3MaNuqYn7XeZJoUWxiwfw9D.w9ItzYzae8Awf/rRjW',NULL,'2026-09-09 11:18:29',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('234fda18-4684-4a70-aa99-1b8d7ede3b2f','MEM-1789042429763','DEMELASH','FEYESA','TOLA','+251913583956',NULL,'MALE','MARRIED',42,1,1,'SECONDARY',NULL,NULL,'GULELE','02',NULL,NULL,NULL,0,1,'2026-09-10 12:13:49','158','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/234fda18-4684-4a70-aa99-1b8d7ede3b2f/1789042463342-86504241.jpeg',NULL,'$2b$12$NZB/5GGnAhbckc9l6vlrdeXmfmpTDxbNbpk70udQlp4hfZPnFqnwW',NULL,'2026-09-10 12:13:49',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('24c8f6b4-9580-4b8f-ae5d-4fac3c8996c9','MEM-1788974466364','MASHO','AYALEW ','ABERA','+251960489061',NULL,'MALE','SINGLE',45,0,0,'SECONDARY',NULL,NULL,'ARADA','04',NULL,NULL,NULL,0,1,'2026-09-09 17:21:06','23/18','GOV_EMP',1600.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$kwsg7P2KPA.sjiFVGGAYOenB49CnldDXWCWHxNGeHXCISFvG.BZ7m',NULL,'2026-09-09 17:21:06',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('264a489f-e4bc-49b5-9713-83a41eb0388a','MEM-1788957112014','TEKELE','TADESE','KEBEDE','+251933489920',NULL,'MALE','SINGLE',55,0,0,'SECONDARY',NULL,NULL,'ARADA','09',NULL,NULL,NULL,0,0,NULL,'876','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,'/uploads/members/264a489f-e4bc-49b5-9713-83a41eb0388a/1788957213208-896242990.jpeg','$2b$12$A3TMdUvB5loIzLQNS1hVFuQJUxa3/F.9vQQKOsILEcIKOCD36aStC',NULL,'2026-09-09 12:31:52',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('26c0f9ca-ac0a-4a1b-a064-99aff20ba32d','MEM-1789040974753','TESHALE','ABEBE','MEKONNEN','+251911609496',NULL,'MALE','SINGLE',47,0,0,'SECONDARY',NULL,NULL,'LEDETA','03',NULL,NULL,NULL,0,1,'2026-09-10 11:49:34','042','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$kOpmAxsl8eG8pCS.gUoXfumcPllz50DUs809wa8LR3L069Uj5XyIS',NULL,'2026-09-10 11:49:34',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('2852a107-bc21-4f5a-bc4a-71c1ce965132','MEM-1788963915936','BIRHANU','DEMESE','KEBEDE','+251929456090',NULL,'MALE','MARRIED',53,3,1,'SECONDARY',NULL,NULL,'YEKA','07',NULL,NULL,NULL,0,1,'2026-09-09 14:25:15','27/45','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$ZaAXqDA65bqOxox3EN5cu.JFuZa0DWoCR3wi5ZMywp1DlHbxumwe.',NULL,'2026-09-09 14:25:15',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('2bc3e407-014a-4af5-994d-6e00e9669495','MEM-1789028817030','MUHABA','BUSER','OUSEMAN','+251911132460',NULL,'FEMALE','SINGLE',48,0,0,'SECONDARY',NULL,NULL,'ADISS KETEMA','04',NULL,NULL,NULL,0,1,'2026-09-10 08:26:57','01/1075','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$LEoKugeF3si7xcLCXi9aIeCF862MW2Lf.c/VPv.LuEUywfXMuadXW',NULL,'2026-09-10 08:26:57',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('348d0db5-c8dc-4630-b17c-924bcc5ded93','MEM-1789042989370','EMEBET','LEMA','DEMESA','+251965895307',NULL,'FEMALE','SINGLE',NULL,0,0,NULL,NULL,NULL,'YEKA','04',NULL,NULL,NULL,0,1,'2026-09-10 12:23:09','916','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$sd1sS4gIsC.bRWClxahIhe37coKg4RCuXsr/Z/iJpU.WMxJwdPoSO',NULL,'2026-09-10 12:23:09',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('35540088-1f1f-4e9e-86fc-79104fbb3f25','MEM-1789028351107','MERIMA','KEDER','AHEMED','+251907338966',NULL,'FEMALE','SINGLE',48,0,0,'SECONDARY',NULL,NULL,'ADISS KETEMA','09',NULL,NULL,NULL,0,1,'2026-09-10 08:19:11','ADISS','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$tJ1TAP4eZHL359oOLtyH8OVc2jvxE.QaUA5Ka5aT9Ru20ZtU0j0j6',NULL,'2026-09-10 08:19:11',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('383a8906-176a-49e3-ba93-348f8be5150b','MEM-1788952827658','MULUKENE','TILAHUN','KEBEDE','+251911111117',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:20:27','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$5zmLWuYdwJ1wdb4Yfdv1HuEesN9dUUBr.M9UXspVOw3U1hGU1uSJK',NULL,'2026-09-09 11:20:27',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('3a783381-eb38-4680-ba13-be1f4034b47d','MEM-1788880216154','ALEMU','ESHETU','GEDAMU','+251969013377',NULL,'FEMALE','MARRIED',55,4,2,'SECONDARY',NULL,NULL,'ADDIS KETEMA','06','03',NULL,NULL,0,0,NULL,'502','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$.ggfn7oSm52J0lNPVkwwLO00nE4.J0p84nyA9xDeLhPEwfhLG3keC',NULL,'2026-09-08 15:10:16',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('3bcc492c-4391-4639-96b6-203f809f31a1','MEM-1788974022161','HELEN','AYALEW','TADEG','+251910031841',NULL,'FEMALE','SINGLE',40,0,0,'SECONDARY',NULL,NULL,'N/S/L','07',NULL,NULL,NULL,0,1,'2026-09-09 17:13:42','1619','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$sUlWqwQ9SnAh9njACGhlxu7tg.oQAIGPtTDuhd.BfVeg088OyzYJu',NULL,'2026-09-09 17:13:42',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('3c5e5da5-b74b-4c05-a26d-9c8547d4822d','MEM-1788960575608','SOFONIYAS','GETENET','KEBEDE','+251960596799',NULL,'MALE','SINGLE',55,0,0,'SECONDARY',NULL,NULL,'ARADA','04',NULL,NULL,NULL,0,1,'2026-09-09 13:29:35','141','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$JlOzu2pcE/UUCwVXcVCf7.x7YpsilX.odP90VfsG52pzhp7HCCAji',NULL,'2026-09-09 13:29:35',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('3cf96762-7ae3-4470-af2b-857c99159a84','MEM-1789034888441','BINEYAM','AMARE','T/WOLD','+251903133709',NULL,'MALE','SINGLE',27,0,0,'SECONDARY',NULL,NULL,'LEMI KURA','10',NULL,NULL,NULL,0,1,'2026-09-10 10:08:08','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/3cf96762-7ae3-4470-af2b-857c99159a84/1789034908192-822495907.jpeg',NULL,'$2b$12$ixYiOdMd7RfobOul.IXC9.arI/51eRNSoIkV2S34Oae5atZYrgZXu',NULL,'2026-09-10 10:08:08',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('3e5ccd73-bec4-4818-878a-53165c232f00','MEM-1788954560664','MAMO','KIFELE','MESEKELU','+251911053789',NULL,'MALE','MARRIED',53,6,4,'SECONDARY',NULL,NULL,'YEKA','12','12',NULL,NULL,0,1,'2026-09-09 11:49:20','NON','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$FGUR8ircLCOpuxQqZaUNe.4xDW/pwUSNx.R9/lJ4mv7Zw4YajdR2S',NULL,'2026-09-09 11:49:20',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('3e95ee8a-2164-4e2a-842c-d05030bf4793','MEM-1788957546840','HAYELU','ABRHAM','KEBEDE','+251975204396',NULL,'MALE','SINGLE',50,0,0,NULL,NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 12:39:06','427','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$w9MbeJjH.Yqa1hVnvA2xOOXuK86QwLRe0EvzihZnQamTDwBZWoH96',NULL,'2026-09-09 12:39:06',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('40789668-76a3-4194-91e4-93f1166b732b','MEM-1788971185297','MESETAWET','WOLEDE','W/YOHANES','+251910373242',NULL,'FEMALE','SINGLE',44,0,0,'SECONDARY',NULL,NULL,'BOLE','04',NULL,NULL,NULL,0,0,NULL,'262','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$wuYZNcgj02nRa6bx6hux/OBOBNhzwoHe6bSrWCmUMb5jn7.LAtrmW',NULL,'2026-09-09 16:26:25',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('41ebdd83-9aa7-4bf3-bd83-835f33dff1e2','MEM-1788969465606','TEREFE','RADAYE','KEBEDE','+251929293896',NULL,'MALE','SINGLE',30,0,0,'SECONDARY',NULL,NULL,'YEKA','09',NULL,NULL,NULL,0,1,'2026-09-09 15:57:45','133','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$vQqof4mQf5vtbDLSroX8UesFmHuUkFWHcysQa3Jeaz0hHXMcLHX2.',NULL,'2026-09-09 15:57:45',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('43ef26d2-9882-4279-a444-e3284eccdc9e','MEM-1789036424043','SELOMON','ASEGEDOM','KEBEDE','+251911110009',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-10 10:33:44','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$q/sr9tR5z98HxaxP7juHTuMAsEo2QBG.kPX2a5poKErcxC1oBBsEq',NULL,'2026-09-10 10:33:44',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('44bd0a08-1a30-4269-8f80-9a3de285d097','MEM-1789036830897','AKLILU','NAHUSENAY','AKALU','+251911408294',NULL,'MALE','SINGLE',52,0,0,'SECONDARY',NULL,20,'GULELE','03',NULL,NULL,NULL,0,1,'2026-09-10 10:40:30','4/8','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/44bd0a08-1a30-4269-8f80-9a3de285d097/1789036859826-176066668.jpeg',NULL,'$2b$12$VtutpuPLGiysz6xY//suDuoV9JZjDem.kwQb/tuTfxbgONmDblYq.',NULL,'2026-09-10 10:40:30',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('44f945ac-6933-4973-9d61-b4297b419889','MEM-1788871233457','FASIL','GETACHEW','TEREFE','+251920249910',NULL,'MALE','SINGLE',33,0,0,'MASTERS','SOCIAL WORKER',10,'KIRKOS','04','29','BULGARIYA',NULL,3,1,'2026-09-08 12:40:33','425/29','NGO',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$GndNNB5p.ipeTrkp1LPmqOurqBcsI1mhaOFxHMUI65sGHKlrLSK9e',NULL,'2026-09-08 12:40:33',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('48cfd890-0914-4076-a259-03e46486fbeb','MEM-1788953762811','RAHEL','AREGAY','KEBEDE','+251911111156',NULL,'FEMALE','SINGLE',30,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:36:02','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$rKw1mk2ZH87s7TWhzH6/BuJ2SipSlGt0axqePPb2WaE917zAx7Lju',NULL,'2026-09-09 11:36:02',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('4a4db1fb-8cf8-4df9-b643-e19c8b968340','MEM-1788960739102','MEKURIYA','REPISO','KEBEDE','+251926793346',NULL,'MALE','MARRIED',59,4,3,'SECONDARY',NULL,NULL,'YEKA','09',NULL,NULL,NULL,0,1,'2026-09-09 13:32:19','396','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$7bl99he1PxW2FvJMZPFn2.YspTgi9L1RONKIkAMgH7RM2kpGW3Ike',NULL,'2026-09-09 13:32:19',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('4b4776de-1afa-413e-a0f9-e498ee5c7982','MEM-1788960049584','BEKELE','BAYEKEDAGN','BATI','+251929334899',NULL,'MALE','MARRIED',59,2,2,'SECONDARY',NULL,NULL,'ARADA','04',NULL,NULL,NULL,0,1,'2026-09-09 13:20:49','478','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/4b4776de-1afa-413e-a0f9-e498ee5c7982/1788960088996-353396484.jpeg',NULL,'$2b$12$zDLXDy.3KMwm.eKS9rYXTedUsAg8ydZwE6wHkOcqkA6JxUtzWtQiW',NULL,'2026-09-09 13:20:49',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('502dd89b-159e-4fd0-804a-58d1963e9ac6','MEM-1788873854528','ESKEDAR','BIRHANU','TAYE','+251911028181',NULL,'MALE','MARRIED',34,2,2,'MASTERS','ENGINER',7,'ADDIS KETEMA','06','30',NULL,NULL,10,1,'2026-09-08 13:24:14','502','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/502dd89b-159e-4fd0-804a-58d1963e9ac6/1788873888493-242141109.jpeg',NULL,'$2b$12$piNbV/r/tZB8HIuIsk.jF.dy2CCeRWGS2wm.XDI443HMfBHJwmhdS',NULL,'2026-09-08 13:24:14',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('53d62144-8ccd-475e-9aec-a159785f628d','MEM-1789034743982','AMANUEL','ALEMU','FOYATO','+251977693703',NULL,'MALE','SINGLE',25,0,0,'SECONDARY',NULL,NULL,'BOLE','06',NULL,NULL,NULL,0,1,'2026-09-10 10:05:43','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$FXSKJsQhEDXgAm5msjkmseDg7ANwoWSdVbxjj60.nvgf18g.EoXPy',NULL,'2026-09-10 10:05:43',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('54dee1ac-d21c-430f-95c0-f5e7425e4cee','MEM-1788958689926','BEKELE','BIRHANU ','W/MICHEL','+251929384897',NULL,'MALE','MARRIED',59,0,0,'SECONDARY',NULL,NULL,'ARADA','01',NULL,NULL,NULL,0,0,NULL,'475','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$qJvU.rrDdTk4iqQqSVXgP.q2pX85/b8r6NjtE5/heIfE9.rGaeEc6',NULL,'2026-09-09 12:58:09',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('5543ea44-90ed-40ba-9633-b2afc4cc7c5b','MEM-1788957378624','AMARE','KETEMA','KEBEDE','+251912368803',NULL,'MALE','SINGLE',53,0,0,'SECONDARY',NULL,NULL,'GULELE','023',NULL,NULL,NULL,0,1,'2026-09-09 12:36:18','09/332','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$d6BhUlqBq6XGxcXcCzg2Xugu.9EgxWvvvk5OQOWR5IIVGZ5h9lp7C',NULL,'2026-09-09 12:36:18',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('567aac30-1354-483c-8c68-5206a15f6090','MEM-1788962996969','BELAY','AMEHA','KEBEDE','+251922493855',NULL,'MALE','SINGLE',35,0,0,NULL,NULL,NULL,'YEKA','10',NULL,NULL,NULL,0,1,'2026-09-09 14:09:56','231','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$9hpYrllj/L5tv9zjh2m6del1aYhiAM4KI8cv8ZJW79jMbyWNKbCje',NULL,'2026-09-09 14:09:56',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('593e199b-b6df-4898-91b7-3e00e263c119','MEM-1788872698476','DEGEFU','HABETE','GAMEBO','+251926154525',NULL,'MALE','SINGLE',36,0,0,'MASTERS',NULL,15,'KIRKOS','08','26',NULL,NULL,0,1,'2026-09-08 13:04:58','850','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$w7Oc/3jmw.ohQlrMfLA60eYNobMJqlvRVirpt9Zg1hGPcp54g8IAm',NULL,'2026-09-08 13:04:58',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('5a3a33f1-85fc-4d55-b1c4-e15da227f290','MEM-1788961965626','SELOMON','ASHENAFI','G/HIOWT','+251945783928',NULL,'MALE','SINGLE',24,0,0,'SECONDARY',NULL,NULL,'YEKA','07',NULL,NULL,NULL,0,0,NULL,'713','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$8Tgu7CWJWeLBjQIE18Fu8OnBVqzVuKhl/EzgB4koffwk5u.Mbe0jC',NULL,'2026-09-09 13:52:45',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('5a87b252-9cb1-4451-b4ab-8f5d50867685','MEM-1789042785258','YOHANES','NEGUSU','ESHETU','+251945959514',NULL,'MALE','MARRIED',50,0,0,'PRIMARY',NULL,NULL,'ADISS KETEMA','13',NULL,NULL,NULL,0,1,'2026-09-10 12:19:45','3750','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$W7C6nMg0H.YjfrnfjvCjBuce9ukOc1vbsZ7B5ZPI8Vwu2ZPPDPWI.',NULL,'2026-09-10 12:19:45',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('5cb029d7-6c3d-4107-9cc5-5538de7448fc','MEM-1788959492335','MEREKENE','MELEKE','KEBEDE','+251910351138',NULL,'FEMALE','MARRIED',50,0,0,'SECONDARY',NULL,NULL,'GULELE','06',NULL,NULL,NULL,0,1,'2026-09-09 13:11:32','923/1','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$225GVEEoWQMco9CDIf8xOuRZSkQA6CORtDd9TUpWMNbuuhqdRd3rm',NULL,'2026-09-09 13:11:32',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('5cbddaa1-2df2-4617-a8e7-199f65ae89ba','MEM-1789029244354','HABTAM','DEBEBE','TAYA','+251940115054',NULL,'FEMALE','SINGLE',24,0,0,'SECONDARY',NULL,NULL,'LEDETA','03',NULL,NULL,NULL,0,1,'2026-09-10 08:34:04','805/37','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$R39LRWGWetqUDBkJSJ9x7u1Qu0kYFSnvSPZFmarTK4d/suC1Y99he',NULL,'2026-09-10 08:34:04',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('5fda041f-2188-47c5-b6f5-ac4c2bac846c','MEM-1788966777868','MESGANAW','GETAWEYE','KEBEDE','+251960413243',NULL,'MALE','MARRIED',49,1,3,'SECONDARY',NULL,NULL,'YEKA','04',NULL,NULL,NULL,0,1,'2026-09-09 15:12:57','339','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$bZ.hrNshbTECi5idsfeIquYAHmM8dQYqf2jcXw7kdKoH4/RbLrSi2',NULL,'2026-09-09 15:12:57',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('608a3826-b684-4417-a37f-4017c75b55d0','MEM-1788882401801','OLANA','MULETA','GELETE','+251911049694',NULL,'MALE','MARRIED',62,2,4,'SECONDARY','OPERATION MANEGER',30,'KIRKOS','10','14',NULL,NULL,0,1,'2026-09-08 15:46:41','B113','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$k5CmR0OTk781n/HONJHDeOwlOHjei9vDB7kTHwptg6jovLeFha78y',NULL,'2026-09-08 15:46:41',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('62f48de4-6dee-48a8-8ec5-077d7157d201','MEM-1788873277241','YEDENEKACHEW','GEREMACHEW','SESA','+251902343930',NULL,'MALE','MARRIED',33,0,0,'MASTERS','BANKER',10,'YEKA','06',NULL,NULL,'90735724970613',0,1,'2026-09-08 13:14:37','10','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/62f48de4-6dee-48a8-8ec5-077d7157d201/1788873312654-107752985.jpeg',NULL,'$2b$12$0f6PmQP7vyl6Hsx3MAP9yuSQsdmDfvu7T.Wuqr71h.VzmVWRz7C/W',NULL,'2026-09-08 13:14:37',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('645c2b01-09de-4a57-8607-b5401fafcfb4','MEM-1788955802708','MULU','GIZE','KEBEDE','+251945203546',NULL,'MALE','SINGLE',34,0,0,NULL,NULL,NULL,'YEKA','09',NULL,NULL,NULL,0,1,'2026-09-09 12:10:02','137','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$FaefeSi77K6fnh0xV/tG0OSVbzgnXNYzh3V9e0Jc9UkmM6ywkluAu',NULL,'2026-09-09 12:10:02',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('66829223-0fcf-4c3f-89e9-d21f48c9d8b6','MEM-1788958854829','MANAYEBET','KASA','KEBEDE','+251910459725',NULL,'MALE','MARRIED',57,2,2,'SECONDARY',NULL,NULL,'ARADA','02',NULL,NULL,NULL,0,1,'2026-09-09 13:00:54','513','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$XYboN9YaMnEvv/6GgmJ55e3sb52N13AwzknXraWRACX5pieBKmMKm',NULL,'2026-09-09 13:00:54',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('6917e0df-354c-4997-8048-5a26356a51d0','MEM-1789043536185','NEBEYU','LAKEBU','AKLILU','+251910094409',NULL,'MALE','SINGLE',33,0,0,'DEGREE',NULL,33,'A.A','07',NULL,NULL,NULL,0,1,'2026-09-10 12:32:16','137','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$X7a5cPcuCkiYsX2QoDuVbONi0zKjVVyxdOsgmXEd8sQSVI5nEWETC',NULL,'2026-09-10 12:32:16',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('6979abe2-647f-4e3d-b500-779138a8abb5','MEM-1789040207900','MESFEN','YELA','YAEKOB','+251911082768',NULL,'MALE','SINGLE',48,0,0,'DEGREE',NULL,13,'YEKA','05',NULL,NULL,NULL,0,1,'2026-09-10 11:36:47','329','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/6979abe2-647f-4e3d-b500-779138a8abb5/1789040228608-78170945.jpeg',NULL,'$2b$12$5/U0pjOXEPc/71UFnzdAoupbvSQRbrAo/tb0T0jmhk2SY8bYLiztu',NULL,'2026-09-10 11:36:47',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('6c1309a3-c4d6-479e-847d-b078d7905d70','MEM-1788874506095','G/MAREYAM','G/SILASE','MELESE','+251912661031',NULL,'MALE','MARRIED',48,3,1,'SECONDARY','DRIVER',21,'YEKA','02','03',NULL,NULL,0,1,'2026-09-08 13:35:06','792','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$TIqCRbVvr2hr6aIEQDMua.vNSbH1TbKoGBpfBp6ifjzm1jMwbf.qK',NULL,'2026-09-08 13:35:06',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('6c3c9d84-6641-4bdd-95f2-7e7bb813e0db','MEM-1788955613187','SEBER','TADESE','KEBEDE','+251926789999',NULL,'MALE','SINGLE',50,0,0,'SECONDARY',NULL,NULL,'YEKA','01',NULL,NULL,NULL,0,1,'2026-09-09 12:06:53','267','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$Up5k0yHN8AmFruStcnQx9OGCD5rSfyntr5ZEYdeJ1FL1U3LvTtH1.',NULL,'2026-09-09 12:06:53',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('6f292535-9f8e-4394-b13d-b68aefc00790','MEM-1789036560536','MUSE','ALAMERE','MENGESTE','+251911167599',NULL,'MALE','SINGLE',34,0,0,'DEGREE',NULL,NULL,'BOLE','04',NULL,NULL,NULL,0,1,'2026-09-10 10:36:00','09/31','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/6f292535-9f8e-4394-b13d-b68aefc00790/1789036576837-106802951.jpeg',NULL,'$2b$12$kk0zX3cVi5Ch1ZWxMP1TZuyBuMCrsXgDswHvmUrmn3G8j5rTXV1SC',NULL,'2026-09-10 10:36:00',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('710a9ba7-75b2-4f4b-a0a7-c84f0539d75c','MEM-1789029448506','TIGEST','ZERIHUN','KEBEDE','+251930226092',NULL,'FEMALE','SINGLE',28,0,0,'SECONDARY',NULL,NULL,'YEKA','12',NULL,NULL,NULL,0,1,'2026-09-10 08:37:28','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$wGl1AyenopOwkEsLpuhW9ucHhYfxF9r.jwRoi6EBQ2e4g1Vjggl8a',NULL,'2026-09-10 08:37:28',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('76f4bf15-7dc2-4345-b9da-90eccdf326e5','MEM-1788953889525','FIKADU','KASE','TEKELU','+251911111198',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:38:09','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/76f4bf15-7dc2-4345-b9da-90eccdf326e5/1788953914605-285425121.jpeg',NULL,'$2b$12$zacItKF9z7N6QUE5vDvpSeLw01gUTW9HNWMuMAdJ6vv8ldURMrmOW',NULL,'2026-09-09 11:38:09',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('7838f795-41cf-438a-a360-3b5ed451c9d3','MEM-1788879858717','ELENI','BIRHANU ','TAYE','+251957514873',NULL,'FEMALE','SINGLE',24,0,0,'SECONDARY',NULL,NULL,'ADDIS KETEMA','06',NULL,NULL,NULL,0,1,'2026-09-08 15:04:18','502','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$s3d2GgQXqE1XKu.xg2QkJOmNrdade2VorF9KCS.j2dtLUq8BncxC.',NULL,'2026-09-08 15:04:18',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('79b6c42e-6d0a-486a-b7c6-472be5b0e8c2','MEM-1788870605206','BOGALE','KIFTO','BARKIYE','+251926725754',NULL,'MALE','MARRIED',33,1,2,'SECONDARY',NULL,15,'K.K','12',NULL,'LUKANDA',NULL,10,1,'2026-09-08 12:30:05','114','INDIVIDUAL',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/79b6c42e-6d0a-486a-b7c6-472be5b0e8c2/1788870656412-146979216.jpeg',NULL,'$2b$12$JPQx7PEVKeF3cERyg2dUaOswpL/mBzU3HDB7YraBFYyL5uivhZQEi',NULL,'2026-09-08 12:30:05',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('7ace4df8-2554-4dfa-927d-d0623812a64f','MEM-1789044938805','MARAMAWIT',NULL,'ALTAYEWORK','+251911231351',NULL,'MALE','SINGLE',NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'GOV_EMP',0.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$YujE4BHNQAeuIURW/7iaX.LoiwDL99i2ODIsOAnI83KkWSV3OEXu.',NULL,'2026-09-10 12:55:38',NULL,0,NULL,NULL,'2026-09-16 13:45:56',NULL),('7e350710-1a9c-444a-b6a1-c78f2b591faf','MEM-1788967063058','MASERA','MARASA','KEBEDE','+251929459064',NULL,'MALE','SINGLE',39,0,0,'SECONDARY',NULL,NULL,'YEKA','09',NULL,NULL,NULL,0,1,'2026-09-09 15:17:43','345','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$uSIjLPnFFO4BXPLx9DRsiO1FprWQq9K8Zm0P83D3vnJdBSyz8S0U2',NULL,'2026-09-09 15:17:43',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('7e6aca46-e4b6-4b39-83ee-f849b1dc0033','MEM-1788968398479','ASEGED','SAMI','KEBEDE','+251922384920',NULL,'MALE','SINGLE',33,0,0,'SECONDARY',NULL,NULL,'ARADA','04',NULL,NULL,NULL,0,1,'2026-09-09 15:39:58','20/35','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$vzlB9/3L6z5ZYh6Olvi1J.jQf9M1kA126m8A2T2WXJyfVfM1J7Vy.',NULL,'2026-09-09 15:39:58',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('7eca5692-46d3-4f81-bfa8-9ac5af1613e3','MEM-1788973225142','ATSEDE','GESESE','KEBEDE','+251910805291',NULL,'FEMALE','MARRIED',54,2,2,'SECONDARY',NULL,NULL,'YEKA','01',NULL,NULL,NULL,0,1,'2026-09-09 17:00:25','168','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$F.Q/jG0cOlN8z.zSmwOZaOXpTVncsBh/eoojA1nvVnn5XTruFSSiO',NULL,'2026-09-09 17:00:25',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('7fd5769d-2109-4bad-bd2b-f7ffe0ebf5df','MEM-1788966180711','MUNEYE','MULUADAM','BITEW','+251929453035',NULL,'MALE','MARRIED',29,4,1,'SECONDARY',NULL,NULL,'ARADA','05',NULL,NULL,NULL,0,1,'2026-09-09 15:03:00','3/29','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/7fd5769d-2109-4bad-bd2b-f7ffe0ebf5df/1788966255133-999287397.jpeg',NULL,'$2b$12$qBzZArQldY.boZelIFERfO2EBw7RzMmZCuFNaRcvoL6VNbDE/2Xda',NULL,'2026-09-09 15:03:00',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('81eee018-fd80-48c9-9e0d-af6e96239e3e','MEM-1789043208406','YORDANOS','DEMESE','KEBEDE','+251911121314',NULL,'MALE','SINGLE',NULL,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-10 12:26:48','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$FMdMSn9ZxWhvoB8EZBfIx.HVrcK4pF3LSWFA9Hb/K0TQePDuQG41m',NULL,'2026-09-10 12:26:48',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('85097b59-ad30-4432-ba3f-1710d48204ac','MEM-1788953586439','DAGMAWI','TESFAYE','KEBEDE','+251911111143',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:33:06','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$fywFdNGbNdi.ntEil5fxqeJ7yh1Y/1aKs00NcB9k9gR.dU.QofzWW',NULL,'2026-09-09 11:33:06',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('862e459e-855c-4f66-99d7-489c4bf0656e','MEM-1788879667987','SEFANIT','BIRHANU ','TAYE','+251936168781',NULL,'FEMALE','SINGLE',26,0,0,'SECONDARY',NULL,NULL,'ADDIS KETEMA','06','30',NULL,NULL,0,0,NULL,'502','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$MAGpICOhRddltdxEYAYu1uhQn/cJrakXd5njyqXZ0HsyuTZTPXHxi',NULL,'2026-09-08 15:01:07',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('866522a0-d12b-4043-abde-46e12ee96100','MEM-1788960385225','TEFERA','MAMO','KEBEDE','+251929667133',NULL,'MALE','SINGLE',56,0,0,'SECONDARY',NULL,NULL,'ARADA','05',NULL,NULL,NULL,0,1,'2026-09-09 13:26:25','271','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$An.gdkNsLpcGCEm648UqMuhIK83DRHnmW.eJE5L1ViOoS7LKTleCG',NULL,'2026-09-09 13:26:25',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('8dcbb4b6-c861-408c-8867-bf59ab4c77bf','MEM-1788961743266','NEGESE','GUREMASA','KEBEDE','+251901354596',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'ARADA','04',NULL,NULL,NULL,0,1,'2026-09-09 13:49:03','226','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$q6KimG7A6mnhor3/Ti0EduGTIFMNpj6vS.O7xmxO4c17FinMmww7W',NULL,'2026-09-09 13:49:03',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('8fe3662b-99c8-4942-81aa-b1fddac08fe0','MEM-1788952626552','SELOMON','ABEBE','KEBEDE','+251911111119',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:17:06','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$DZ7V.oZaaUO9dzi12TvbMee.17d9sL0oKCgODJ/zE6v.z7qock/vi',NULL,'2026-09-09 11:17:06',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('907adecd-706b-4d81-bf4d-f02c4598e487','MEM-1789028996023','FIKERTE','NURGA','SAHERE','+251933754396',NULL,'FEMALE','SINGLE',34,0,0,'SECONDARY',NULL,NULL,'K.K','04',NULL,NULL,NULL,0,1,'2026-09-10 08:29:56','15/10','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$Q3KTPtSSwntMxcX0v4.1..yog.6rHwMUcmHm7HMrW/dwxwivvbg8q',NULL,'2026-09-10 08:29:56',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('91dceba9-9f0e-4722-a1b5-4c1e9fb86ef4','MEM-1788962256063','MELEKAMU','MESFEN','SHALAMO','+251929389920',NULL,'MALE','SINGLE',29,0,0,'SECONDARY',NULL,NULL,'ARADA','09',NULL,NULL,NULL,0,1,'2026-09-09 13:57:36','18/30','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/91dceba9-9f0e-4722-a1b5-4c1e9fb86ef4/1788962285925-173966917.jpeg',NULL,'$2b$12$0qx1jPICx7F/2xyS.urMPucWcHcentepYndO8O35wlIaL8heucQqu',NULL,'2026-09-09 13:57:36',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('92a251d4-ed3e-47ab-8d2c-248521f0a51e','MEM-1789039727912','ABEN','TESFAYE','ABEBE','+251923522939',NULL,'MALE','SINGLE',30,0,0,'DEGREE',NULL,NULL,'YEKA','05',NULL,NULL,NULL,0,1,'2026-09-10 11:28:47','283','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/92a251d4-ed3e-47ab-8d2c-248521f0a51e/1789039747648-879812292.jpeg',NULL,'$2b$12$eVz0n9osUOue0cFDykr6nuSTkzrva1QZLGgH7M/oCmZoS5pZx/M.y',NULL,'2026-09-10 11:28:47',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('936a9216-5709-4dce-801d-0c9c5cea0949','MEM-1788960937338','YOHANES','BEZU','KEBEDE','+251926783950',NULL,'MALE','MARRIED',54,2,3,'SECONDARY',NULL,NULL,'YEKA','01',NULL,NULL,NULL,0,1,'2026-09-09 13:35:37','296','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$Dv6wkhVf9LCqsfqo0/mm4.k2UCuTTgN0cZaMu0YtennsvPu5VzHKS',NULL,'2026-09-09 13:35:37',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('94a6c8cc-406c-4907-8542-abe12f21246f','MEM-1788963364493','GASHAW','KEBEDE','MEKONNEN','+251911234935',NULL,'MALE','SINGLE',45,0,0,'SECONDARY',NULL,NULL,'YEKA','09',NULL,NULL,NULL,0,1,'2026-09-09 14:16:04','23/49','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/94a6c8cc-406c-4907-8542-abe12f21246f/1788963403148-259557649.jpeg',NULL,'$2b$12$kTqmsEnyZ5rmSkXgInrzOe.hlEUqb8zD5GrU6/34giAxGEdyMX2ZS',NULL,'2026-09-09 14:16:04',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('956366e2-7821-419f-8716-932d5a636af6','MEM-1788968956513','AMAHA','ALENGA','KEBEDE','+251955302300',NULL,'MALE','SINGLE',38,0,0,'SECONDARY',NULL,NULL,'ARADA','05',NULL,NULL,NULL,0,1,'2026-09-09 15:49:16','09/15','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/956366e2-7821-419f-8716-932d5a636af6/1788969058251-292543342.jpeg',NULL,'$2b$12$7ov32r9fJKq5G8zSo..kQuiLt6GgfkxIwP//afvifvIo6qWmnnaNO',NULL,'2026-09-09 15:49:16',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('96c2148a-7005-47ee-a8bc-6098e60b7bc1','MEM-1789043933550','ADEBER','DESALEGN','TESFAYE','+251923282941',NULL,'MALE','MARRIED',35,0,0,'SECONDARY',NULL,NULL,'KIRKOS','21',NULL,NULL,NULL,0,1,'2026-09-10 12:38:53','543','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$Xc/3fyKIMP4947S78WVY4ev.5F0AKc5xrMkRxO3zQBiPYS1d15Or2',NULL,'2026-09-10 12:38:53',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('9745b5fa-423b-4e90-bb15-79dffa205cb5','MEM-1789029823547','SISAYE','ABATE','YEMAM','+251921741993',NULL,'FEMALE','SINGLE',28,0,0,'SECONDARY',NULL,NULL,'KIRKOS','10',NULL,NULL,NULL,0,1,'2026-09-10 08:43:43','268','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$jCMyW7dUN7j55zbbsrL6R.7iDiSbwX/pHGrfELyuXUXXWoQHj.wTy',NULL,'2026-09-10 08:43:43',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('9781cf3d-b7a2-4e3f-b00b-10fd6c7fb33e','MEM-1788877840580','KIDEST ','SELOMON','GEBEYHU','+251980575051',NULL,'FEMALE','SINGLE',28,0,0,'DEGREE',NULL,NULL,'YEKA','02',NULL,NULL,NULL,0,0,NULL,'502','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$CFmsWMvWM2z7Mx/ybR30AuWT5j6hq2J0jau6baXMo2WulPt26/.YS',NULL,'2026-09-08 14:30:40',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('986ed510-06ad-4f65-962c-72bb3441eb99','MEM-1788953395535','YALEKUT','BAHIRU','KEBEDE','+251911111121',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:29:55','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$sWEtYuaUoXr45k.bvJc0lONzX3G0xVbUQ3X4NXE5A16/JPP7YACnO',NULL,'2026-09-09 11:29:55',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('98b59f4a-1dc6-492d-aebf-a3e9e88af88b','MEM-1789040370917','SABIT','KEDER','JEMAL','+251966144515',NULL,'MALE','MARRIED',29,0,0,'SECONDARY',NULL,NULL,'YEKA','05',NULL,NULL,NULL,0,1,'2026-09-10 11:39:30','259','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/98b59f4a-1dc6-492d-aebf-a3e9e88af88b/1789040409701-943012533.jpeg',NULL,'$2b$12$RsXGU9OmI7ljmSu/v6WMh.dyExOcAVbXH1maXy7IJlZkX3Njl3AC.',NULL,'2026-09-10 11:39:30',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('9976f7fa-74ec-4722-9355-4c4cd9153895','MEM-1788968295035','FATAW','FELEKE','TEGEGN','+251905142045',NULL,'MALE','SINGLE',29,0,0,'SECONDARY',NULL,NULL,'ARADA','10',NULL,NULL,NULL,0,1,'2026-09-09 15:38:15','331','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$y6beNs2L9C5NUM9ZIGcWxuvP1B2Oop7Pu13cbzHnOkbXh1.ReARCu',NULL,'2026-09-09 15:38:15',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('9c052ffd-489c-4e4c-900d-6d8b4c8ccd87','MEM-1788967209156','ABERHAM','ASEFA','KEBEDE','+251901412138',NULL,'MALE','MARRIED',45,2,2,'SECONDARY',NULL,NULL,'ARADA','03',NULL,NULL,NULL,0,1,'2026-09-09 15:20:09','229','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$Nb.D9KCWtrogv7WF.oSWTernkge0EdQKRZadsA3X46GyN5TXuq8e.',NULL,'2026-09-09 15:20:09',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('9c4a5afe-890d-4e53-a5ae-d092f4d303d4','MEM-1788875558732','ELSABET','W/GIORGIS','MARU','+251911656793',NULL,'FEMALE','MARRIED',50,3,3,'DEGREE',NULL,15,'GULELE','07','04',NULL,'NURSE',10,0,NULL,'469/4','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$4UDIXI./WbTQZMv6sLa9ue9XZlfle2pHQU3FWzxeUnFBjc9X2.AtO',NULL,'2026-09-08 13:52:38',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('9c7c2051-b365-4da7-8206-7c132251ecce','MEM-1789042321375','ADISU','GETACHEW','TEREFE','+251920249911',NULL,'MALE','SINGLE',31,0,0,'SECONDARY',NULL,NULL,'N/S/L','12',NULL,NULL,NULL,0,1,'2026-09-10 12:12:01','ADISS','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$XQUn5lsm3oNZpD6QeebM6.p2447Tp6yxbBdWOjAMQ/CSfRStnRlBm',NULL,'2026-09-10 12:12:01',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('9e4cec16-f3a3-4dfa-b697-5ed0a8e6ac95','MEM-1789035220794','LIDEYA','ABEBE','KEBEDE','+251911100000',NULL,'FEMALE','SINGLE',30,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-10 10:13:40','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$UrM4ZgJZRIq2j74WS27/4OYyicYDdFHKcBbJ5C4jwj/bnN.8vjN3e',NULL,'2026-09-10 10:13:40',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('9fd14da0-5691-4045-8085-b69571eadf1f','MEM-1788973438992','SENAYET','AREGA','FELEKE','+251934421139',NULL,'FEMALE','SINGLE',43,0,0,'SECONDARY',NULL,NULL,'AKAKI KALITI','08',NULL,NULL,NULL,0,1,'2026-09-09 17:03:58','377','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$OtRIfm36.YVigKuQ/a/4xuQysLM5lrZd3PulStMP0O4ZDCWwl7w7y',NULL,'2026-09-09 17:03:58',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('a06c2b4a-6140-447b-983b-b2ec19a2c2da','MEM-1789040689649','H/EYESUS','ERSIDO','MASHO','+251919833110',NULL,'MALE','SINGLE',29,0,0,'DEGREE',NULL,NULL,'YEKA','07',NULL,NULL,NULL,0,1,'2026-09-10 11:44:49','ADISS','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/a06c2b4a-6140-447b-983b-b2ec19a2c2da/1789040708705-535296014.jpeg',NULL,'$2b$12$7VzEJG9zHDGLSl7Mc0k6GuHgbPgVz6o.ffiGQQ9UuLES1yNT4tIN2',NULL,'2026-09-10 11:44:49',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('a3c75b02-a9d6-4552-983e-4846681292ed','MEM-1789034997058','KIBROM','SISAY','TESHOME','+251923556301',NULL,'MALE','SINGLE',27,0,0,'SECONDARY',NULL,NULL,'K.K','03',NULL,NULL,NULL,0,1,'2026-09-10 10:09:57','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$//yMefque2NDGxDW9bVHZ.9a/EWddGZOq0t7xlJKv1/T5J0OKrsYG',NULL,'2026-09-10 10:09:57',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('a5af51cc-2f79-49a6-adaf-0a30c5428338','MEM-1789043739272','MELEKAMU','DEBASE','KEFELA','+251928579817',NULL,'MALE','SINGLE',28,0,0,'DEGREE',NULL,4,'BOLE BULEBULA','03',NULL,NULL,NULL,0,1,'2026-09-10 12:35:39','136/35','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$TV20he.yhOUzUGlW9GHg7eeNoVPbbjCj5vtNeok4/xhr5X4YMA9z.',NULL,'2026-09-10 12:35:39',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('a67c1e45-2923-41b1-9959-f6834cce1c83','MEM-1788955214899','GIRMA','GETACHEW','KEBEDE','+251933489928',NULL,'MALE','MARRIED',50,3,2,'SECONDARY',NULL,NULL,'YEKA','07',NULL,NULL,NULL,0,1,'2026-09-09 12:00:14','278','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$WE6gYGdO5Pvx.oFY1H7G9Okd/.WFqAwrYzxdpynkljoGSdUkKRHtq',NULL,'2026-09-09 12:00:14',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('a8e3e83d-f32d-4e51-8e2f-2a02d3adfa7d','MEM-1788876019848','YESHAK','TADELE ','TEKA','+251911424481',NULL,'MALE','SINGLE',35,2,2,'DEGREE','MANEGEMENT',5,'ADDIS KETEMA','02',NULL,NULL,NULL,10,1,'2026-09-08 14:00:19','10','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/a8e3e83d-f32d-4e51-8e2f-2a02d3adfa7d/1788876066386-368497156.jpeg',NULL,'$2b$12$Nhz29NA8qNrZ5.d4lCNQ4uk5rgJg/zFeg1n8wD6gFhv0ZHart48W.',NULL,'2026-09-08 14:00:19',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('ac699f8a-52d4-4199-9bec-852b30e6ef1c','MEM-1788953140934','WENDESEN','GUGESA','KEBEDE','+251911111114',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:25:40','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$q7A7hLajwFSkvCLwHfaeI.hJnVfwPbraTS6AgkxzJ7IulUOFhbuoK',NULL,'2026-09-09 11:25:40',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('ad6218e0-5708-4e21-90cc-878b02064836','MEM-1789040850432','AHELAM','MUSETEFA','AHEMED','+251926014396',NULL,'FEMALE','SINGLE',28,0,0,'DEGREE',NULL,NULL,'N/S/L','09',NULL,NULL,NULL,0,1,'2026-09-10 11:47:30','1388','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$Go50xW./hafPZMApdFd3CO5kmFu26b2q6xByaODLIqz.e1VFXHIcS',NULL,'2026-09-10 11:47:30',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('b0f4fdd9-30c8-470f-9f9d-5db9e7c57c6b','MEM-1788952024188','BETELHEM DAWIT','DAWIT','DANIEL','+251911111111',NULL,'FEMALE','SINGLE',26,0,0,'DEGREE',NULL,NULL,'LEMI KURA','08',NULL,NULL,NULL,0,1,'2026-09-09 11:07:04','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/b0f4fdd9-30c8-470f-9f9d-5db9e7c57c6b/1788952087442-801997004.jpeg',NULL,'$2b$12$Q30.nzEZ1cJSVpT73qEObOMj3Lozl3JMmE0dkGUYLMcasPEFla40K',NULL,'2026-09-09 11:07:04',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('b249b8b2-cc5a-41ea-8d13-976ee69a5080','MEM-1789036693316','AREAYA','MULUGETA','GEBERE','+251911181685',NULL,'MALE','SINGLE',38,0,0,'DEGREE',NULL,NULL,'BOLE','07',NULL,NULL,NULL,0,1,'2026-09-10 10:38:13','1391','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$5Pw0X1rX6N4SnbJRB4ydd.LgS/AWp.aYOTY.FTm3KWvdws1Kz.96C',NULL,'2026-09-10 10:38:13',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('b38514bb-791c-4474-94c0-ef608f20e944','MEM-1788974838698','LENSE','GELETA','BELTO','+251930004428',NULL,'FEMALE','SINGLE',NULL,0,0,NULL,NULL,NULL,'BOLE','12',NULL,NULL,NULL,0,1,'2026-09-09 17:27:18','ADISS','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$tqQTI4Ek7I0e2BYYWIpypuAKU3D3pD377qNH4TR/tSTExTmNm/DNm',NULL,'2026-09-09 17:27:18',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('b6836deb-7d87-4bdc-b4a3-fdcdab80e9c8','MEM-1788880875673','HAMELEMAL','BIRHANU ','TOBA','+251940509315',NULL,'FEMALE','SINGLE',25,2,2,'DEGREE',NULL,NULL,'ARADA','09',NULL,NULL,NULL,0,0,NULL,'10','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$ExuXi6KFgWgaK6kpt9TczeCnRNFuoVVe6tPpwy9cXVQ1WLilWgMyC',NULL,'2026-09-08 15:21:15',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('b6d36e13-ec2d-426b-ab6d-a540fc74c91e','MEM-1788970559931','MARETA','PAWELOS','KEBEDE','+251916772350',NULL,'MALE','SINGLE',34,0,0,'SECONDARY',NULL,NULL,'KIRKOS','09',NULL,NULL,NULL,0,1,'2026-09-09 16:15:59','455','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$JpOIcFIO0E1kTlLU/ZweuOJGq4Mq4JFCZ5g8885q04avW5Ohv2M6G',NULL,'2026-09-09 16:15:59',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('b88df60c-58e3-424a-92a1-6b57933f6485','MEM-1788876923824','YOHANES','TESHOME','BOGALE','+251932579029',NULL,'MALE','SINGLE',30,2,3,'MASTERS','LOGISTIC',4,'A.A','06',NULL,NULL,NULL,0,1,'2026-09-08 14:15:23','116/28','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$a6njjC.GbpINXsinzDLgbO62hDMUBpZ8aE9XHgIThtQ6RCLaTtDEC',NULL,'2026-09-08 14:15:23',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('b9b6e2d7-a7f4-464a-b852-7b62f5878663','MEM-1788874866943','KASAHUN','MANKELKELOT','ALTAYEWORK','+251911231350',NULL,'MALE','MARRIED',65,2,2,'DEGREE',NULL,30,'YEKA','12','03',NULL,NULL,0,1,'2026-09-08 13:41:06','098','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$r13iRJQguYAjnHlhV2b/Ve6QlBemPDB78PT.mdwx5ZABzedMDaf9W',NULL,'2026-09-08 13:41:06',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('ba5971e6-c954-459a-b552-d6866f36b629','MEM-1789041726583','ALAZAR','DEREJA','KEBEDE','+251912741690',NULL,'MALE','MARRIED',NULL,0,0,'MASTERS',NULL,18,'YEKA','12',NULL,NULL,NULL,0,1,'2026-09-10 12:02:06','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/ba5971e6-c954-459a-b552-d6866f36b629/1789041766386-158394796.jpeg',NULL,'$2b$12$EFFG1yogey6sLSF3u6IJjenzPEJZSAOZSi/NfQJOYWe6S94JyC8jK',NULL,'2026-09-10 12:02:06',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('bba9c7d1-7bf0-4b2a-a5ac-ef1937b639ad','MEM-1789041127132','MEBERE','SEWBESEW','GUANGUL','+251913115815',NULL,'MALE','SINGLE',NULL,0,0,'SECONDARY',NULL,NULL,'GULELE','02',NULL,NULL,NULL,0,1,'2026-09-10 11:52:07','506','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,'/uploads/members/bba9c7d1-7bf0-4b2a-a5ac-ef1937b639ad/1789041150807-932386817.jpeg','$2b$12$.dRN0zjDOjdSMHRiNjydiuIUpyWAuHeFYp5QDmSRQriXKIHpTMb.i',NULL,'2026-09-10 11:52:07',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('bc28d672-c24a-46f3-9b7d-81d3d1a00225','MEM-1788953689172','SARA','HAYELE','KEBEDE','+251911111145',NULL,'FEMALE','SINGLE',30,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:34:49','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$cQRSJ0rmgzU/tP6gCYQdOOkw7.SgmhxGszfxthT9V6MtX9W3AinKO',NULL,'2026-09-09 11:34:49',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('beb99821-29c5-4e2a-b280-2d5c8aa32c8d','MEM-1789042092845','TSEGANESH','TEKESTE','DERESE','+251912300690',NULL,'FEMALE','SINGLE',40,0,0,NULL,NULL,NULL,'GULELE','07',NULL,NULL,NULL,0,1,'2026-09-10 12:08:12','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$r6lRanv.ihBlKFMthcbBLOl0PYscIFGBcOoelRdavZxt9f8TLJndi',NULL,'2026-09-10 12:08:12',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('c004dc05-dcd6-420a-803c-d62e755ee3fc','MEM-1788956013244','YETAYAL','DEGAGA','KEBEDE','+251943181707',NULL,'MALE','SINGLE',56,0,0,'SECONDARY',NULL,NULL,'LEDETA','10',NULL,NULL,NULL,0,1,'2026-09-09 12:13:33','946','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/c004dc05-dcd6-420a-803c-d62e755ee3fc/1788956079111-839268600.jpeg',NULL,'$2b$12$Pr.BL46way8vjAbeoMaAMO4sREzNHWcWdai8Fv5NB40Vgwh0H5.3u',NULL,'2026-09-09 12:13:33',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('c11b3152-8933-4933-809f-e5689a41077c','MEM-1788956357515','ASENAKE','TEFERA','KEBEDE','+251912059427',NULL,'MALE','MARRIED',50,3,4,'SECONDARY',NULL,NULL,'LEMI KURA','05',NULL,NULL,NULL,0,1,'2026-09-09 12:19:17','38/17','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$c0hXyov4P.jyNs.X2RCaEeNevcJp9ntKt.wyXJhyA8ydMZm6OioFG',NULL,'2026-09-09 12:19:17',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('c15a9a7f-be02-4fbd-831a-c780b174b3b3','MEM-1788956863325','ZENEBE','AMARE','KEBEDE','+251929394890',NULL,'MALE','MARRIED',49,4,2,'SECONDARY',NULL,NULL,'ARADA','07',NULL,NULL,NULL,0,0,NULL,'572','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$OgefX../KIIN8Ahv7dOb/Om60zGuE.D6VTZW6JNNY/Cn/UvQ1jQdq',NULL,'2026-09-09 12:27:43',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('c29a457f-17ed-4413-be42-2f48975fa1d4','MEM-1789034450330','YEDENEKACHEW','GELANA','NEGERA','+251979021479',NULL,'MALE','SINGLE',34,0,0,'DEGREE',NULL,NULL,'K.K','04',NULL,NULL,NULL,0,1,'2026-09-10 10:00:50','298','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/c29a457f-17ed-4413-be42-2f48975fa1d4/1789034470513-458865693.jpeg',NULL,'$2b$12$cu1M94MlCZRAagQB3vXh0.cH8WZpr1JLI0WHNHEVJm3JE8JeHpI4W',NULL,'2026-09-10 10:00:50',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('c7457ba2-5c56-469f-81ca-bb7a9373803d','MEM-1788877288153','G/EGZIABHER','G/MEDEN','HAYELU','+251932355404',NULL,'MALE','SINGLE',29,0,0,'MASTERS','MANEGEMENT',5,'A.A','01',NULL,NULL,NULL,0,0,NULL,'502','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$wmRKnwF.tFSuwCHr6GNfdObDgtiGNbV1wI1ejBtmuQZUV/sPbrVXC',NULL,'2026-09-08 14:21:28',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('c886caca-a7fa-4956-8548-6a19318af6ab','MEM-1789036310523','GETAHUN ','ASENAKE','TESEFAW','+251904288893',NULL,'MALE','SINGLE',28,0,0,'DEGREE',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-10 10:31:50','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,'/uploads/members/c886caca-a7fa-4956-8548-6a19318af6ab/1789036331851-941321497.jpeg','$2b$12$esoB887I5e6Whmba7sD.QuPU7U7hofC3BYqmNB.Be.JIIv983H/1K',NULL,'2026-09-10 10:31:50',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('ca062c8a-de77-47f4-83ff-1b5c47e66599','MEM-1789034587733','PETEROS','MOGES','WENDEMU','+251911651343',NULL,'MALE','MARRIED',52,3,3,'DEGREE',NULL,NULL,'BOLE','13',NULL,NULL,NULL,0,1,'2026-09-10 10:03:07','1609','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/ca062c8a-de77-47f4-83ff-1b5c47e66599/1789034627097-127977178.jpeg',NULL,'$2b$12$r2oaUlTWA7BT..JyM9FtI.WY79szV.oNCh.yJKGFDTT.2ZZxEB.V6',NULL,'2026-09-10 10:03:07',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('cdd7702f-480d-4f69-b68d-fca7344d493e','MEM-1788959813105','KEBEDE','DAMETE','DESETA','+251929342938',NULL,'MALE','SINGLE',55,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,0,NULL,'227','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/cdd7702f-480d-4f69-b68d-fca7344d493e/1788959855845-119421352.jpeg',NULL,'$2b$12$SKplFTakVKKdvzjy8lr6MuYXkQ5iZ./4VPdevVHOfZQ821EF7DDca',NULL,'2026-09-09 13:16:53',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('ceec09bf-3ab2-4625-b1f3-e04a8727e13c','MEM-1789042619915','WENDEMAGEGN','ALEMU','TAYE','+251911502853',NULL,'MALE','MARRIED',52,1,4,'MASTERS',NULL,22,'ADISS KETEMA','13',NULL,NULL,NULL,0,1,'2026-09-10 12:16:59','3476','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$cYU/UVPvvMmT6eC1v1Gzt.GhmWprM48KpmyDwxwSj5w/qcB.T3eBW',NULL,'2026-09-10 12:16:59',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('cfb7adcc-fc58-40a3-8207-e453137e5984','MEM-1788953056845','BETELHEM','YOSEPH','KEBEDE','+251911111115',NULL,'FEMALE','SINGLE',30,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:24:16','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$O5pgbQvqhfes0OJzH85Rwegg6uBRHGyaoOs2jpGVuDNnzDhn.9PRS',NULL,'2026-09-09 11:24:16',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('d0e435f0-a7a3-4dc8-8693-460eb145ad07','MEM-1789040533400','RABUMA','DABA','FAYERA','+251912103966',NULL,'MALE','SINGLE',41,0,0,'MASTERS',NULL,15,'N/S/L','01',NULL,NULL,NULL,0,1,'2026-09-10 11:42:13','ADISS','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$vFRZNiw8/7Bi6TN6eKtYY.OA6cR.2MkRwk.QsMnZnp558DZuLXtjq',NULL,'2026-09-10 11:42:13',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('d504bb2b-711a-463a-bcda-7c504ea82b2e','MEM-1788879123272','MAHELET','BIRHANU ','TAYE','+251983433470',NULL,'FEMALE','SINGLE',29,0,0,'DEGREE',NULL,4,'ADDIS KETEMA','06','30',NULL,NULL,10,0,NULL,'502','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$QoP5OTCe0.KCym4xxvqxNuDkOSj0dH4XVyacM7gzDcZJhwK9M3w52',NULL,'2026-09-08 14:52:03',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('d8f7d3ec-6eb8-4c1c-a31a-0187b282bf94','MEM-1788953287519','FIKRU','AMARE','KEBEDE','+251911111112',NULL,'MALE','SINGLE',35,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 11:28:07','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$R14sBGQaXFjJcEhyRnfsreACKUXvDh4C6yZ9KykvxZa3McSp.zwo.',NULL,'2026-09-09 11:28:07',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('de4d257e-dcff-4f19-a38f-ba1ee4634013','MEM-1788959648230','AGEGNEW','HAKAYE','KEBEDE','+251928993049',NULL,'MALE','SINGLE',60,0,0,'SECONDARY',NULL,NULL,'YEKA','04',NULL,NULL,NULL,0,1,'2026-09-09 13:14:08','121','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$AHd8nsTgLSb.SSGTLSytuODwjYuhAhfNlMu9YkSTHK8CbdSGJ/gFu',NULL,'2026-09-09 13:14:08',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('dfaf6650-0edf-4ba1-a80d-f3cf24e0df6a','MEM-1788955408442','HENOK','AMARO','KEBEDE','+251923489928',NULL,'MALE','SINGLE',56,0,0,'SECONDARY',NULL,NULL,'ARADA','02',NULL,NULL,NULL,0,1,'2026-09-09 12:03:28','727','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$Waw9obSiNdPOnhAE4oA0ROPigeU0BkfiqIxcvPj73kWTRX6lhBF5i',NULL,'2026-09-09 12:03:28',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('e033d589-00ae-4989-a945-922f99bf6ca1','MEM-1788958141626','ABDITA','GARA','KEBEDE','+251960452134',NULL,'MALE','SINGLE',45,0,0,'SECONDARY',NULL,NULL,'YEKA','07',NULL,NULL,NULL,0,1,'2026-09-09 12:49:01','13/45','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$yufumFNK6ox2Oj2Rr.mH5uo.U2TpsGTJ8I0j64s4h0JuR19r9rw.y',NULL,'2026-09-09 12:49:01',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('e3762222-c40e-491d-bd8c-6aa7a1fbb567','MEM-1789028540068','REHIMA','ALEMU','KEBEDE','+251911605367',NULL,'FEMALE','SINGLE',24,0,0,'SECONDARY',NULL,NULL,'LEDETA','07',NULL,NULL,NULL,0,1,'2026-09-10 08:22:20','258','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$KoLOa.lxMbqlQZqU8aNW3uTW6z0vLrMZIxlCOadfDOeXjGdrHLGAG',NULL,'2026-09-10 08:22:20',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('e3a6d8b7-13a2-472c-950b-63fc8de1a6d5','MEM-1789036171772','TILAHUN','METKU','GEBRE','+251900055929',NULL,'MALE','MARRIED',40,1,2,'DIPLOMA',NULL,16,'SHEGER CITY','08',NULL,NULL,NULL,0,1,'2026-09-10 10:29:31','ADISS','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/e3a6d8b7-13a2-472c-950b-63fc8de1a6d5/1789036195770-986452600.jpeg',NULL,'$2b$12$eo/r7VPfkm6bAY6dJo/sPOjHlcQDkQv1iHYvSZU3K.iTDTrdnX2q2',NULL,'2026-09-10 10:29:31',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('e42a2906-13b2-43ab-b9b5-66763f7aa92d','MEM-1788961149983','JIFARA','MEGERSA','KEBEDE','+251929384899',NULL,'MALE','SINGLE',34,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 13:39:09','23/45','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$5bdPFVmRZdYJgh3SXO4DreUauy8WNkG2817T5Twzh.7fJFmgevZf2',NULL,'2026-09-09 13:39:09',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('e490409b-c4d9-4c70-8ccc-d39cbc9b9766','MEM-1788969942559','BIRUK','AMARE','KEBEDE','+251930454739',NULL,'FEMALE','SINGLE',27,0,0,'PRIMARY',NULL,NULL,'YEKA','09',NULL,NULL,NULL,0,1,'2026-09-09 16:05:42','445','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/e490409b-c4d9-4c70-8ccc-d39cbc9b9766/1788969958222-145333018.jpeg',NULL,'$2b$12$Jjg4Ffh8MBTEmOPCrzecPulQttfVGTw5kwKMyOAEAons0Inml/rpe',NULL,'2026-09-09 16:05:42',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('e64135b5-1f0e-4236-bc89-ee1e65b71f3f','MEM-1788972540753','ABEZASH','AYELE','SIBHAT','+251969006979',NULL,'FEMALE','SINGLE',34,0,0,'SECONDARY',NULL,NULL,'LEDETA','08',NULL,NULL,NULL,0,1,'2026-09-09 16:49:00','ADISS','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$St3mgis6S6VcPZy003LDT.D/RTaGjPBTzroo./hkHkH9QYfsV6RDG',NULL,'2026-09-09 16:49:00',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('e6cc6534-75c3-401b-878e-8a452b9e5000','MEM-1788961343675','KIDANE','SEMU','KASAYE','+251930412396',NULL,'MALE','SINGLE',23,0,0,'SECONDARY',NULL,NULL,'YEKA','09',NULL,NULL,NULL,0,1,'2026-09-09 13:42:23','288','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$BpDVkCUb.6d/ixuRw.AuDu2lNECUvxs1ahSntEK1hdfKQhgkHNeYC',NULL,'2026-09-09 13:42:23',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('e7cc4280-0dad-48de-ac17-20914e711a76','MEM-1788971506567','TIZITA','ABEBAW','YEMER','+251943935049',NULL,'FEMALE','SINGLE',54,0,0,NULL,NULL,NULL,'YEKA','08',NULL,NULL,NULL,0,1,'2026-09-09 16:31:46','147','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,'/uploads/members/e7cc4280-0dad-48de-ac17-20914e711a76/1788971698534-96855728.jpeg','$2b$12$zZdFa6oDxHN5J006ZnIMVeyheMauD6pU/TF0gjdy8yA0If4kNEtGS',NULL,'2026-09-09 16:31:46',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('e9ff7367-3f84-47e7-bdbb-a672ea1f1bb0','MEM-1788880483005','BIRHANU','TAYE','DILNESAW','+251912875448',NULL,'MALE','MARRIED',60,4,2,'DEGREE','TEACHER',NULL,'ADDIS KETEMA','06','30',NULL,NULL,0,0,NULL,'502','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$w7qAsBBehv.pEkldXwtaxuhGw3//yDKK.goRffOOyLVBXWdo8u35i',NULL,'2026-09-08 15:14:43',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('ed6d69cc-2b7e-4de7-bb85-60898d8d2e8f','MEM-1789043332486','YAKEMZEWED','AYALEW','DESETA','+251991736868',NULL,'MALE','SINGLE',48,0,0,'MASTERS',NULL,15,'KIRKOS','11',NULL,NULL,NULL,0,1,'2026-09-10 12:28:52','227','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/ed6d69cc-2b7e-4de7-bb85-60898d8d2e8f/1789043367162-586232828.jpeg',NULL,'$2b$12$MWDnwa/i6NcHaVKht8hbBusgMgtCebplTHkgN/laeyShIWGKllwkS',NULL,'2026-09-10 12:28:52',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('ef8d58bc-3ed0-4d28-8ce4-ebc60cc1bc1d','MEM-1789041461654','SELOMON','SHUME','TULU','+251923939770',NULL,'MALE','SINGLE',NULL,0,0,'DIPLOMA',NULL,NULL,'N/S/L','201',NULL,NULL,NULL,0,1,'2026-09-10 11:57:41','0936','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$RJaOscT1U8975H7Eal4Zs.ClwmJntSolYYMqmjmOeq2eW5te3Njlm',NULL,'2026-09-10 11:57:41',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('f229a23f-0f38-4a9b-8d6b-1a3983f24c02','MEM-1789040025044','BESUFEKAD','TADESE','ASHENAFI','+251967296966',NULL,'MALE','SINGLE',26,0,0,'DEGREE',NULL,NULL,'LEMI KURA','13',NULL,NULL,NULL,0,1,'2026-09-10 11:33:45','001','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/f229a23f-0f38-4a9b-8d6b-1a3983f24c02/1789040046414-622537596.jpeg',NULL,'$2b$12$qHgP0KbxW/WoxB3c1kKxCuUsNW6PDCdFy8LidqapRBCX89Xp56HWa',NULL,'2026-09-10 11:33:45',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('f5b59e3f-80e8-42fb-913f-dfeb464c01e6','MEM-1789033874986','MAEREG','YERGA','GEBREHANA','+251933961940',NULL,'FEMALE','SINGLE',36,0,0,'SECONDARY',NULL,NULL,'KIRKOS','04',NULL,NULL,NULL,0,1,'2026-09-10 09:51:14','ADISS','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$PeXTUridVD1x/XrH/RJLqOJ/IOenlNV3zq9S8WEKB9B77YZLGyYMC',NULL,'2026-09-10 09:51:14',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('f6cf5ace-b9f7-4bff-be56-78d7563e372e','MEM-1788962496073','ASEREGED','GEZE','KEBEDE','+251944392899',NULL,'MALE','SINGLE',37,0,0,'SECONDARY',NULL,NULL,'YEKA','03',NULL,NULL,NULL,0,1,'2026-09-09 14:01:36','12/38','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$ixvykV2d0s4Pzcn.aP3kI.i5feUP3y1jtXGfDxorkdtE1eisnSfWW',NULL,'2026-09-09 14:01:36',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('f7f38717-eb3d-4c2a-913b-ee20504f0549','MEM-1788954147262','ASENAKU','EMESHAW','TADESE','+251945288191',NULL,'FEMALE','SINGLE',25,0,0,'SECONDARY',NULL,5,'YEKA','12',NULL,NULL,NULL,0,1,'2026-09-09 11:42:27','ADISS','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,'/uploads/members/f7f38717-eb3d-4c2a-913b-ee20504f0549/1788954206681-836171665.jpeg',NULL,'$2b$12$T0Oc/aqOT1HUIOcGFyQkhu9.gR/wQ/7pqJrBT.702NfpatuHFGpD6',NULL,'2026-09-09 11:42:27',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('f9d812a0-eff4-4a37-a454-6a13c0b185a1','MEM-1788876388897','NIKODIMOS ','KASAHUN ','MANKELKELOT','+251929906364',NULL,'MALE','SINGLE',35,0,0,'MASTERS','MANEGEMENT',NULL,'YEKA','12',NULL,NULL,NULL,10,0,NULL,'03/Le/98','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$9TBFHdUDyxLUj4yZ7s/8AOfT4znhZ8dOM82jvriNgROG3XzmGdwwe',NULL,'2026-09-08 14:06:28',NULL,0,NULL,NULL,'2026-09-16 14:00:04',NULL),('fabc1046-8283-4729-889c-e3903e6db85e','MEM-1788958463251','DEGEFUGN','HAKAMU','KEBEDE','+251925469728',NULL,'MALE','SINGLE',52,0,0,'SECONDARY',NULL,NULL,'YEKA','08',NULL,NULL,NULL,0,1,'2026-09-09 12:54:23','267','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$dTh7b4x7D2HTrEgq8.0BIeLKCgT26oBk.MTkhRwEY0cf.DyVBkXJC',NULL,'2026-09-09 12:54:23',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL),('fd245c91-605f-4955-ae7e-56058ddc3a7d','MEM-1789041265038','WENDEMAGEGN','AWERARIS','DEMOZ','+251911193943',NULL,'MALE','SINGLE',45,0,0,'DEGREE',NULL,NULL,'K.K','04',NULL,NULL,NULL,0,1,'2026-09-10 11:54:25','2980','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$sdfsJYqVTKWPBR7pVgNMnuiJDgwRBXGPXcY4QzCvjetski4vBMVl2',NULL,'2026-09-10 11:54:25',NULL,0,NULL,NULL,'2026-09-16 14:00:06',NULL),('fe4ee5da-7c5a-4b8e-bcb3-a199fe52386d','MEM-1788965668345','ABADI ','RETA','KEBEDE','+251920884950',NULL,'MALE','MARRIED',35,2,2,'SECONDARY',NULL,NULL,'ARADA','03',NULL,NULL,NULL,0,1,'2026-09-09 14:54:28','13/39','GOV_EMP',16000.00,NULL,'ACTIVE',NULL,NULL,NULL,NULL,'$2b$12$97/1T40YRZcihBVytKDoN.s9M5sq9TuS6WZgjyUThSkdNwTiVXHje',NULL,'2026-09-09 14:54:28',NULL,0,NULL,NULL,'2026-09-16 14:00:05',NULL);
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
INSERT INTO `profit_distribution_buckets` VALUES ('42000000-0000-4000-8000-000000000011','42000000-0000-4000-8000-000000000001','MEMBER_SHARE_DIVIDEND','Share Capital Fund',4900,'SHARE_UNITS',1,1,'2026-08-31 22:05:48'),('42000000-0000-4000-8000-000000000012','42000000-0000-4000-8000-000000000001','MEMBER_SAVINGS_DIVIDEND','Members Regular Savings Fund',800,'SAVINGS_BALANCE',1,2,'2026-08-31 22:05:48'),('42000000-0000-4000-8000-000000000013','42000000-0000-4000-8000-000000000001','EDUCATION_TRAINING','Education and Training',400,'INTERNAL',0,3,'2026-08-31 22:05:48'),('42000000-0000-4000-8000-000000000014','42000000-0000-4000-8000-000000000001','ENVIRONMENTAL_DEVELOPMENT','Environmental Development and Protection Fund (የአካባቢ ልማትና ጥበቃ)',100,'INTERNAL',0,4,'2026-08-31 22:05:48'),('42000000-0000-4000-8000-000000000015','42000000-0000-4000-8000-000000000001','EMPLOYEE_INCENTIVE','Employee Incentive Fund (የሠራተኞች ማበረታቻ)',200,'INTERNAL',0,5,'2026-08-31 22:05:48'),('42000000-0000-4000-8000-000000000016','42000000-0000-4000-8000-000000000001','BOARD_COMMITTEE_INCENTIVE','Board and Committee Incentive Fund (የቦርድና ኮሚቴ ማበረታቻ)',200,'INTERNAL',0,6,'2026-08-31 22:05:48'),('42000000-0000-4000-8000-000000000017','42000000-0000-4000-8000-000000000001','LOAN_LOSS_RESERVE','Loan Loss Reserve (የማይመለስ ብድር መጠባበቂያ)',400,'INTERNAL',0,7,'2026-08-31 22:05:48');
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
INSERT INTO `profit_distribution_policies` VALUES ('42000000-0000-4000-8000-000000000001',1,'Alef Delta Statutory Profit Distribution',3000,2,'SAV_COMPULSORY','ACTIVE',NULL,'2026-08-31 22:05:48',NULL);
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
INSERT INTO `sacco_master_account` VALUES ('ETB_MASTER','ETB',147000.00,148,'2026-08-31 22:05:48','2026-09-16 14:00:06');
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
  `entry_type` enum('REGISTRATION_FEE','LOAN_INTEREST','LOAN_PENALTY','SAVINGS_INTEREST','MANUAL_REVENUE','MANUAL_EXPENSE','OPENING_ADJUSTMENT','DIVIDEND_PAYOUT','REVERSAL','SERVICE_CHARGE_INFLOW','INSURANCE_HELD','UNUTILIZED_INSURANCE_REVENUE','INSURANCE_CLAIM_UTILIZED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `balance_after` decimal(18,2) NOT NULL,
  `affects_profit` tinyint(1) NOT NULL DEFAULT '1',
  `affects_balance` tinyint(1) NOT NULL DEFAULT '1',
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
INSERT INTO `sacco_master_ledger` VALUES ('001af9a4-7372-4615-a185-9c2a7088c4d4','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,77000.00,1,1,'MEMBER_ACTIVATION','09341a83-984b-4bb3-923d-9b9f9250a11b','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788965870643','REGISTRATION_FEE:09341a83-984b-4bb3-923d-9b9f9250a11b',NULL,'2026-09-16 14:00:05'),('00a759e2-d69d-4ecc-9b41-ad5a8dd1d8b5','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,112000.00,1,1,'MEMBER_ACTIVATION','ca062c8a-de77-47f4-83ff-1b5c47e66599','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789034587733','REGISTRATION_FEE:ca062c8a-de77-47f4-83ff-1b5c47e66599',NULL,'2026-09-16 14:00:06'),('00e4a047-afa4-44b4-81c2-0b75ffd07ab1','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,3000.00,1,1,'MEMBER_ACTIVATION','44f945ac-6933-4973-9d61-b4297b419889','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788871233457','REGISTRATION_FEE:44f945ac-6933-4973-9d61-b4297b419889',NULL,'2026-09-16 14:00:04'),('016ea05e-44e3-4a7a-937f-8f0064e9c9bd','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,33000.00,1,1,'MEMBER_ACTIVATION','0920f343-0712-42bc-bbeb-b4ae1d836466','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953202562','REGISTRATION_FEE:0920f343-0712-42bc-bbeb-b4ae1d836466',NULL,'2026-09-16 14:00:05'),('0231ed38-166a-44e2-942b-9c861984dd39','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,54000.00,1,1,'MEMBER_ACTIVATION','e033d589-00ae-4989-a945-922f99bf6ca1','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788958141626','REGISTRATION_FEE:e033d589-00ae-4989-a945-922f99bf6ca1',NULL,'2026-09-16 14:00:05'),('0670d865-0a9d-425b-b794-709d17fc9bc6','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,2000.00,1,1,'MEMBER_ACTIVATION','79b6c42e-6d0a-486a-b7c6-472be5b0e8c2','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788870605206','REGISTRATION_FEE:79b6c42e-6d0a-486a-b7c6-472be5b0e8c2',NULL,'2026-09-16 14:00:04'),('092ffe10-3abb-4d00-b0c5-09f1b58c4c09','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,12000.00,1,1,'MEMBER_ACTIVATION','f9d812a0-eff4-4a37-a454-6a13c0b185a1','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788876388897','REGISTRATION_FEE:f9d812a0-eff4-4a37-a454-6a13c0b185a1',NULL,'2026-09-16 14:00:04'),('0ced0b86-cfc0-46cb-9271-01b6d05188a5','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,141000.00,1,1,'MEMBER_ACTIVATION','5a87b252-9cb1-4451-b4ab-8f5d50867685','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789042785258','REGISTRATION_FEE:5a87b252-9cb1-4451-b4ab-8f5d50867685',NULL,'2026-09-16 14:00:06'),('0e25206d-a3dd-48f2-8e5e-08a68d923610','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,67000.00,1,1,'MEMBER_ACTIVATION','e42a2906-13b2-43ab-b9b5-66763f7aa92d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788961149983','REGISTRATION_FEE:e42a2906-13b2-43ab-b9b5-66763f7aa92d',NULL,'2026-09-16 14:00:05'),('0ff22f4c-165c-429f-a773-5cba3d1b1351','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,85000.00,1,1,'MEMBER_ACTIVATION','956366e2-7821-419f-8716-932d5a636af6','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788968956513','REGISTRATION_FEE:956366e2-7821-419f-8716-932d5a636af6',NULL,'2026-09-16 14:00:05'),('1166e008-216a-43b6-8ff6-95be0149c97f','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,100000.00,1,1,'MEMBER_ACTIVATION','b38514bb-791c-4474-94c0-ef608f20e944','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788974838698','REGISTRATION_FEE:b38514bb-791c-4474-94c0-ef608f20e944',NULL,'2026-09-16 14:00:05'),('11b28025-0256-40ef-8ff5-4dabac8514a2','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,102000.00,1,1,'MEMBER_ACTIVATION','e3762222-c40e-491d-bd8c-6aa7a1fbb567','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789028540068','REGISTRATION_FEE:e3762222-c40e-491d-bd8c-6aa7a1fbb567',NULL,'2026-09-16 14:00:05'),('150c74ca-34d4-4334-9edd-bae01f0eb96f','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,4000.00,1,1,'MEMBER_ACTIVATION','1bee65a1-40c4-4d18-b5c4-c282d38275c5','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788872265394','REGISTRATION_FEE:1bee65a1-40c4-4d18-b5c4-c282d38275c5',NULL,'2026-09-16 14:00:04'),('153dc361-ed91-4c9f-a424-071a4a9ade73','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,134000.00,1,1,'MEMBER_ACTIVATION','ef8d58bc-3ed0-4d28-8ce4-ebc60cc1bc1d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789041461654','REGISTRATION_FEE:ef8d58bc-3ed0-4d28-8ce4-ebc60cc1bc1d',NULL,'2026-09-16 14:00:06'),('15d456ef-f91b-43cd-9c2b-dab256982167','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,16000.00,1,1,'MEMBER_ACTIVATION','d504bb2b-711a-463a-bcda-7c504ea82b2e','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788879123272','REGISTRATION_FEE:d504bb2b-711a-463a-bcda-7c504ea82b2e',NULL,'2026-09-16 14:00:04'),('179bd1a1-18dc-42f8-931d-3fe60bfd2bc3','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,108000.00,1,1,'MEMBER_ACTIVATION','9745b5fa-423b-4e90-bb15-79dffa205cb5','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789029823547','REGISTRATION_FEE:9745b5fa-423b-4e90-bb15-79dffa205cb5',NULL,'2026-09-16 14:00:05'),('1bb5f432-2273-47a7-8255-e0e3c13d65c2','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,19000.00,1,1,'MEMBER_ACTIVATION','7838f795-41cf-438a-a360-3b5ed451c9d3','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788879858717','REGISTRATION_FEE:7838f795-41cf-438a-a360-3b5ed451c9d3',NULL,'2026-09-16 14:00:04'),('1ca2984c-8840-413b-90bc-17b54322abf2','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,43000.00,1,1,'MEMBER_ACTIVATION','3e5ccd73-bec4-4818-878a-53165c232f00','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788954560664','REGISTRATION_FEE:3e5ccd73-bec4-4818-878a-53165c232f00',NULL,'2026-09-16 14:00:05'),('1e44fbc2-15d1-449c-9ee0-b84dcf0cfa0d','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,117000.00,1,1,'MEMBER_ACTIVATION','e3a6d8b7-13a2-472c-950b-63fc8de1a6d5','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789036171772','REGISTRATION_FEE:e3a6d8b7-13a2-472c-950b-63fc8de1a6d5',NULL,'2026-09-16 14:00:06'),('1eb2460e-b426-49c0-9429-20bb9b9ab183','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,75000.00,1,1,'MEMBER_ACTIVATION','2852a107-bc21-4f5a-bc4a-71c1ce965132','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788963915936','REGISTRATION_FEE:2852a107-bc21-4f5a-bc4a-71c1ce965132',NULL,'2026-09-16 14:00:05'),('1f728204-084b-4df5-87b6-55f52305bbc5','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,138000.00,1,1,'MEMBER_ACTIVATION','9c7c2051-b365-4da7-8206-7c132251ecce','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789042321375','REGISTRATION_FEE:9c7c2051-b365-4da7-8206-7c132251ecce',NULL,'2026-09-16 14:00:06'),('20288211-2849-4070-b5b1-11d0fa48f0e9','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,132000.00,1,1,'MEMBER_ACTIVATION','bba9c7d1-7bf0-4b2a-a5ac-ef1937b639ad','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789041127132','REGISTRATION_FEE:bba9c7d1-7bf0-4b2a-a5ac-ef1937b639ad',NULL,'2026-09-16 14:00:06'),('26655e2c-7a69-4c52-bfc2-e49e5d3b0924','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,84000.00,1,1,'MEMBER_ACTIVATION','7e6aca46-e4b6-4b39-83ee-f849b1dc0033','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788968398479','REGISTRATION_FEE:7e6aca46-e4b6-4b39-83ee-f849b1dc0033',NULL,'2026-09-16 14:00:05'),('2798b3d6-f4fa-4bd2-a235-4c9a675a4bed','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,30000.00,1,1,'MEMBER_ACTIVATION','017bf1be-3d8f-4a8d-8fe8-a7fed105c685','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788952898072','REGISTRATION_FEE:017bf1be-3d8f-4a8d-8fe8-a7fed105c685',NULL,'2026-09-16 14:00:05'),('2a5ae697-ac03-4ca8-b0a2-9cbc489eb225','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,78000.00,1,1,'MEMBER_ACTIVATION','7fd5769d-2109-4bad-bd2b-f7ffe0ebf5df','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788966180711','REGISTRATION_FEE:7fd5769d-2109-4bad-bd2b-f7ffe0ebf5df',NULL,'2026-09-16 14:00:05'),('2b54cc29-2fe3-41ac-b17d-7f52c8eb70a0','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,61000.00,1,1,'MEMBER_ACTIVATION','cdd7702f-480d-4f69-b68d-fca7344d493e','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788959813105','REGISTRATION_FEE:cdd7702f-480d-4f69-b68d-fca7344d493e',NULL,'2026-09-16 14:00:05'),('321c7960-c326-4221-8595-fc5ab9d9bf08','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,121000.00,1,1,'MEMBER_ACTIVATION','b249b8b2-cc5a-41ea-8d13-976ee69a5080','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789036693316','REGISTRATION_FEE:b249b8b2-cc5a-41ea-8d13-976ee69a5080',NULL,'2026-09-16 14:00:06'),('32952e65-168e-4527-bc1a-45058a892762','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,21000.00,1,1,'MEMBER_ACTIVATION','e9ff7367-3f84-47e7-bdbb-a672ea1f1bb0','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788880483005','REGISTRATION_FEE:e9ff7367-3f84-47e7-bdbb-a672ea1f1bb0',NULL,'2026-09-16 14:00:04'),('3304b25a-b94f-45ba-b086-58f8f9e2e5ee','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,57000.00,1,1,'MEMBER_ACTIVATION','66829223-0fcf-4c3f-89e9-d21f48c9d8b6','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788958854829','REGISTRATION_FEE:66829223-0fcf-4c3f-89e9-d21f48c9d8b6',NULL,'2026-09-16 14:00:05'),('3385cc60-c117-40ad-8610-e5632e79cbe6','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,125000.00,1,1,'MEMBER_ACTIVATION','f229a23f-0f38-4a9b-8d6b-1a3983f24c02','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789040025044','REGISTRATION_FEE:f229a23f-0f38-4a9b-8d6b-1a3983f24c02',NULL,'2026-09-16 14:00:06'),('36f45bbb-088a-48ac-8da9-9472d70df3ce','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,118000.00,1,1,'MEMBER_ACTIVATION','c886caca-a7fa-4956-8548-6a19318af6ab','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789036310523','REGISTRATION_FEE:c886caca-a7fa-4956-8548-6a19318af6ab',NULL,'2026-09-16 14:00:06'),('3c849bd7-e27e-416f-969e-db502061e1c7','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,97000.00,1,1,'MEMBER_ACTIVATION','3bcc492c-4391-4639-96b6-203f809f31a1','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788974022161','REGISTRATION_FEE:3bcc492c-4391-4639-96b6-203f809f31a1',NULL,'2026-09-16 14:00:05'),('3da285fe-36d3-41c7-9e4a-cfa511e41fa7','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,24000.00,1,1,'MEMBER_ACTIVATION','608a3826-b684-4417-a37f-4017c75b55d0','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788882401801','REGISTRATION_FEE:608a3826-b684-4417-a37f-4017c75b55d0',NULL,'2026-09-16 14:00:04'),('411afecb-3fbc-4ac8-8c64-38aa310a7444','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,106000.00,1,1,'MEMBER_ACTIVATION','710a9ba7-75b2-4f4b-a0a7-c84f0539d75c','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789029448506','REGISTRATION_FEE:710a9ba7-75b2-4f4b-a0a7-c84f0539d75c',NULL,'2026-09-16 14:00:05'),('45cd542f-f3b6-4a50-a774-0c4a773505cc','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,129000.00,1,1,'MEMBER_ACTIVATION','a06c2b4a-6140-447b-983b-b2ec19a2c2da','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789040689649','REGISTRATION_FEE:a06c2b4a-6140-447b-983b-b2ec19a2c2da',NULL,'2026-09-16 14:00:06'),('45fab460-58fc-489d-90f9-dfb7b2817c5f','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,80000.00,1,1,'MEMBER_ACTIVATION','7e350710-1a9c-444a-b6a1-c78f2b591faf','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788967063058','REGISTRATION_FEE:7e350710-1a9c-444a-b6a1-c78f2b591faf',NULL,'2026-09-16 14:00:05'),('46f530bc-d0db-4fbf-add2-20ff8c53dcc3','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,104000.00,1,1,'MEMBER_ACTIVATION','907adecd-706b-4d81-bf4d-f02c4598e487','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789028996023','REGISTRATION_FEE:907adecd-706b-4d81-bf4d-f02c4598e487',NULL,'2026-09-16 14:00:05'),('48d65da6-5bd7-4382-9ce0-79cbb425fc86','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,144000.00,1,1,'MEMBER_ACTIVATION','ed6d69cc-2b7e-4de7-bb85-60898d8d2e8f','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789043332486','REGISTRATION_FEE:ed6d69cc-2b7e-4de7-bb85-60898d8d2e8f',NULL,'2026-09-16 14:00:06'),('4995b72f-372a-4b45-a4f7-e22dc87f01b1','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,18000.00,1,1,'MEMBER_ACTIVATION','862e459e-855c-4f66-99d7-489c4bf0656e','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788879667987','REGISTRATION_FEE:862e459e-855c-4f66-99d7-489c4bf0656e',NULL,'2026-09-16 14:00:04'),('4ae2d6c3-493c-4b17-bd0d-d272df0876e4','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,115000.00,1,1,'MEMBER_ACTIVATION','a3c75b02-a9d6-4552-983e-4846681292ed','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789034997058','REGISTRATION_FEE:a3c75b02-a9d6-4552-983e-4846681292ed',NULL,'2026-09-16 14:00:06'),('4bc34318-6094-482f-93ce-9062e6b32e7e','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,127000.00,1,1,'MEMBER_ACTIVATION','98b59f4a-1dc6-492d-aebf-a3e9e88af88b','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789040370917','REGISTRATION_FEE:98b59f4a-1dc6-492d-aebf-a3e9e88af88b',NULL,'2026-09-16 14:00:06'),('4cde3f17-e9ea-458a-907e-880a2d03a762','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,119000.00,1,1,'MEMBER_ACTIVATION','43ef26d2-9882-4279-a444-e3284eccdc9e','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789036424043','REGISTRATION_FEE:43ef26d2-9882-4279-a444-e3284eccdc9e',NULL,'2026-09-16 14:00:06'),('4dceea8f-c16e-4773-a393-e05fbbf4fffa','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,91000.00,1,1,'MEMBER_ACTIVATION','40789668-76a3-4194-91e4-93f1166b732b','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788971185297','REGISTRATION_FEE:40789668-76a3-4194-91e4-93f1166b732b',NULL,'2026-09-16 14:00:05'),('4f10cf2a-8c93-47ba-81fb-e2b7bb61ed33','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,126000.00,1,1,'MEMBER_ACTIVATION','6979abe2-647f-4e3d-b500-779138a8abb5','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789040207900','REGISTRATION_FEE:6979abe2-647f-4e3d-b500-779138a8abb5',NULL,'2026-09-16 14:00:06'),('4f336eda-0b60-4f4b-b28a-e6451e7d7042','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,50000.00,1,1,'MEMBER_ACTIVATION','c15a9a7f-be02-4fbd-831a-c780b174b3b3','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788956863325','REGISTRATION_FEE:c15a9a7f-be02-4fbd-831a-c780b174b3b3',NULL,'2026-09-16 14:00:05'),('5054480e-37c7-4ced-a2d3-c389ed4912bb','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,142000.00,1,1,'MEMBER_ACTIVATION','348d0db5-c8dc-4630-b17c-924bcc5ded93','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789042989370','REGISTRATION_FEE:348d0db5-c8dc-4630-b17c-924bcc5ded93',NULL,'2026-09-16 14:00:06'),('545247d9-e86e-4a12-b279-bafb23f98bd8','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,60000.00,1,1,'MEMBER_ACTIVATION','de4d257e-dcff-4f19-a38f-ba1ee4634013','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788959648230','REGISTRATION_FEE:de4d257e-dcff-4f19-a38f-ba1ee4634013',NULL,'2026-09-16 14:00:05'),('575e8c34-59fa-4c4d-b139-7abf92a363fa','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,68000.00,1,1,'MEMBER_ACTIVATION','e6cc6534-75c3-401b-878e-8a452b9e5000','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788961343675','REGISTRATION_FEE:e6cc6534-75c3-401b-878e-8a452b9e5000',NULL,'2026-09-16 14:00:05'),('5c330957-2fbd-4c3d-9eed-cad4067a57f1','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,81000.00,1,1,'MEMBER_ACTIVATION','9c052ffd-489c-4e4c-900d-6d8b4c8ccd87','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788967209156','REGISTRATION_FEE:9c052ffd-489c-4e4c-900d-6d8b4c8ccd87',NULL,'2026-09-16 14:00:05'),('5dcb05d4-13d4-4df7-abc8-86d1c8c437b4','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,94000.00,1,1,'MEMBER_ACTIVATION','e64135b5-1f0e-4236-bc89-ee1e65b71f3f','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788972540753','REGISTRATION_FEE:e64135b5-1f0e-4236-bc89-ee1e65b71f3f',NULL,'2026-09-16 14:00:05'),('5f36bbc9-75a3-4636-8306-210e7c003dd0','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,111000.00,1,1,'MEMBER_ACTIVATION','c29a457f-17ed-4413-be42-2f48975fa1d4','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789034450330','REGISTRATION_FEE:c29a457f-17ed-4413-be42-2f48975fa1d4',NULL,'2026-09-16 14:00:06'),('60f5f031-fc6e-4fa2-aceb-5bd6a21bd4fd','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,87000.00,1,1,'MEMBER_ACTIVATION','41ebdd83-9aa7-4bf3-bd83-835f33dff1e2','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788969465606','REGISTRATION_FEE:41ebdd83-9aa7-4bf3-bd83-835f33dff1e2',NULL,'2026-09-16 14:00:05'),('6304632a-b935-457d-a6c6-d744a4dbc0d3','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,120000.00,1,1,'MEMBER_ACTIVATION','6f292535-9f8e-4394-b13d-b68aefc00790','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789036560536','REGISTRATION_FEE:6f292535-9f8e-4394-b13d-b68aefc00790',NULL,'2026-09-16 14:00:06'),('630bcbd9-c7de-48e2-9eb6-c3206c1eb0f8','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,53000.00,1,1,'MEMBER_ACTIVATION','3e95ee8a-2164-4e2a-842c-d05030bf4793','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788957546840','REGISTRATION_FEE:3e95ee8a-2164-4e2a-842c-d05030bf4793',NULL,'2026-09-16 14:00:05'),('64335a84-8ce4-4974-93c1-669fe0e15c27','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,66000.00,1,1,'MEMBER_ACTIVATION','936a9216-5709-4dce-801d-0c9c5cea0949','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788960937338','REGISTRATION_FEE:936a9216-5709-4dce-801d-0c9c5cea0949',NULL,'2026-09-16 14:00:05'),('647ed92a-b85f-442b-8b82-758e0d642ab7','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,55000.00,1,1,'MEMBER_ACTIVATION','fabc1046-8283-4729-889c-e3903e6db85e','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788958463251','REGISTRATION_FEE:fabc1046-8283-4729-889c-e3903e6db85e',NULL,'2026-09-16 14:00:05'),('6567552b-f58f-42ab-b541-f972ad7584c2','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,26000.00,1,1,'MEMBER_ACTIVATION','b0f4fdd9-30c8-470f-9f9d-5db9e7c57c6b','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788952024188','REGISTRATION_FEE:b0f4fdd9-30c8-470f-9f9d-5db9e7c57c6b',NULL,'2026-09-16 14:00:04'),('657441bd-53ae-4c09-bb36-7bcb23e08c61','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,105000.00,1,1,'MEMBER_ACTIVATION','5cbddaa1-2df2-4617-a8e7-199f65ae89ba','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789029244354','REGISTRATION_FEE:5cbddaa1-2df2-4617-a8e7-199f65ae89ba',NULL,'2026-09-16 14:00:05'),('6b6a8867-2b34-436f-b547-e923a5080efc','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,23000.00,1,1,'MEMBER_ACTIVATION','06e9ded4-2b6d-44e2-887d-22c27682d03f','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788881090917','REGISTRATION_FEE:06e9ded4-2b6d-44e2-887d-22c27682d03f',NULL,'2026-09-16 14:00:04'),('6ba2c583-8fae-416c-8181-bfa5b99f9b83','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,6000.00,1,1,'MEMBER_ACTIVATION','62f48de4-6dee-48a8-8ec5-077d7157d201','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788873277241','REGISTRATION_FEE:62f48de4-6dee-48a8-8ec5-077d7157d201',NULL,'2026-09-16 14:00:04'),('6df6bb90-1f5c-4e46-866a-8bc67d3c7288','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,72000.00,1,1,'MEMBER_ACTIVATION','f6cf5ace-b9f7-4bff-be56-78d7563e372e','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788962496073','REGISTRATION_FEE:f6cf5ace-b9f7-4bff-be56-78d7563e372e',NULL,'2026-09-16 14:00:05'),('6ec37a0f-68ce-4dc6-bfd6-afebe721d816','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,86000.00,1,1,'MEMBER_ACTIVATION','11284571-9548-49b5-88bb-b4d42c977db8','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788969213131','REGISTRATION_FEE:11284571-9548-49b5-88bb-b4d42c977db8',NULL,'2026-09-16 14:00:05'),('6fda8317-9314-43ba-a08e-cec209b292bb','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,56000.00,1,1,'MEMBER_ACTIVATION','54dee1ac-d21c-430f-95c0-f5e7425e4cee','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788958689926','REGISTRATION_FEE:54dee1ac-d21c-430f-95c0-f5e7425e4cee',NULL,'2026-09-16 14:00:05'),('7419c5b8-06b5-4727-a1c7-b2b12c071a43','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,98000.00,1,1,'MEMBER_ACTIVATION','24c8f6b4-9580-4b8f-ae5d-4fac3c8996c9','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788974466364','REGISTRATION_FEE:24c8f6b4-9580-4b8f-ae5d-4fac3c8996c9',NULL,'2026-09-16 14:00:05'),('7635e4d7-9a76-448b-9376-b0c27c2b6e13','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,145000.00,1,1,'MEMBER_ACTIVATION','6917e0df-354c-4997-8048-5a26356a51d0','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789043536185','REGISTRATION_FEE:6917e0df-354c-4997-8048-5a26356a51d0',NULL,'2026-09-16 14:00:06'),('77833253-7b42-452a-8ae7-7dbfcfe52eb1','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,131000.00,1,1,'MEMBER_ACTIVATION','26c0f9ca-ac0a-4a1b-a064-99aff20ba32d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789040974753','REGISTRATION_FEE:26c0f9ca-ac0a-4a1b-a064-99aff20ba32d',NULL,'2026-09-16 14:00:06'),('7b71f052-1f42-477a-8a73-b42b4476fa2c','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,113000.00,1,1,'MEMBER_ACTIVATION','53d62144-8ccd-475e-9aec-a159785f628d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789034743982','REGISTRATION_FEE:53d62144-8ccd-475e-9aec-a159785f628d',NULL,'2026-09-16 14:00:06'),('7cf1b961-652b-4d42-84c2-d4e0789a0677','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,92000.00,1,1,'MEMBER_ACTIVATION','e7cc4280-0dad-48de-ac17-20914e711a76','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788971506567','REGISTRATION_FEE:e7cc4280-0dad-48de-ac17-20914e711a76',NULL,'2026-09-16 14:00:05'),('80af9cc5-bd54-4b69-91c9-b43b73297dd4','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,27000.00,1,1,'MEMBER_ACTIVATION','8fe3662b-99c8-4942-81aa-b1fddac08fe0','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788952626552','REGISTRATION_FEE:8fe3662b-99c8-4942-81aa-b1fddac08fe0',NULL,'2026-09-16 14:00:04'),('81abcbb9-34b7-4758-a37a-65b1dc39d9ba','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,114000.00,1,1,'MEMBER_ACTIVATION','3cf96762-7ae3-4470-af2b-857c99159a84','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789034888441','REGISTRATION_FEE:3cf96762-7ae3-4470-af2b-857c99159a84',NULL,'2026-09-16 14:00:06'),('820186c1-15b3-4da0-b025-0d02a29cf084','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,109000.00,1,1,'MEMBER_ACTIVATION','f5b59e3f-80e8-42fb-913f-dfeb464c01e6','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789033874986','REGISTRATION_FEE:f5b59e3f-80e8-42fb-913f-dfeb464c01e6',NULL,'2026-09-16 14:00:05'),('84c68131-1797-414f-82d9-d2d412416b0a','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,41000.00,1,1,'MEMBER_ACTIVATION','76f4bf15-7dc2-4345-b9da-90eccdf326e5','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953889525','REGISTRATION_FEE:76f4bf15-7dc2-4345-b9da-90eccdf326e5',NULL,'2026-09-16 14:00:05'),('87012d4d-4cdf-4974-9f70-689206607ee8','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,62000.00,1,1,'MEMBER_ACTIVATION','4b4776de-1afa-413e-a0f9-e498ee5c7982','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788960049584','REGISTRATION_FEE:4b4776de-1afa-413e-a0f9-e498ee5c7982',NULL,'2026-09-16 14:00:05'),('8756ad74-7c31-4624-9289-9b7d053643c0','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,122000.00,1,1,'MEMBER_ACTIVATION','44bd0a08-1a30-4269-8f80-9a3de285d097','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789036830897','REGISTRATION_FEE:44bd0a08-1a30-4269-8f80-9a3de285d097',NULL,'2026-09-16 14:00:06'),('8ff978a9-3347-4c92-b41d-257f69c33af3','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,103000.00,1,1,'MEMBER_ACTIVATION','2bc3e407-014a-4af5-994d-6e00e9669495','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789028817030','REGISTRATION_FEE:2bc3e407-014a-4af5-994d-6e00e9669495',NULL,'2026-09-16 14:00:05'),('914f2dfe-8cc8-4eab-9e7b-8360adf8cabd','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,1000.00,1,1,'MEMBER_ACTIVATION','08f0703b-6290-449d-8415-1db0a51c6c45','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788869162383','REGISTRATION_FEE:08f0703b-6290-449d-8415-1db0a51c6c45',NULL,'2026-09-16 14:00:04'),('91b27784-0ca3-4394-be02-71b4be53e4af','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,11000.00,1,1,'MEMBER_ACTIVATION','a8e3e83d-f32d-4e51-8e2f-2a02d3adfa7d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788876019848','REGISTRATION_FEE:a8e3e83d-f32d-4e51-8e2f-2a02d3adfa7d',NULL,'2026-09-16 14:00:04'),('91d9e7fa-bbcc-4c68-b4af-5363b53ba59d','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,89000.00,1,1,'MEMBER_ACTIVATION','126673bd-4f5c-467f-b654-6fdffa3ad543','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788970154272','REGISTRATION_FEE:126673bd-4f5c-467f-b654-6fdffa3ad543',NULL,'2026-09-16 14:00:05'),('92837261-53ce-4769-bedc-10d06e83c1bf','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,32000.00,1,1,'MEMBER_ACTIVATION','ac699f8a-52d4-4199-9bec-852b30e6ef1c','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953140934','REGISTRATION_FEE:ac699f8a-52d4-4199-9bec-852b30e6ef1c',NULL,'2026-09-16 14:00:05'),('92c7ea23-0acd-4b85-9556-72b9ca136d19','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,82000.00,1,1,'MEMBER_ACTIVATION','10392591-18e4-4de5-b976-7e6b2b968f65','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788967522950','REGISTRATION_FEE:10392591-18e4-4de5-b976-7e6b2b968f65',NULL,'2026-09-16 14:00:05'),('98019619-f26a-422c-a112-6ae527df1db5','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,58000.00,1,1,'MEMBER_ACTIVATION','10886ad4-baf4-464b-9032-4401b9322390','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788959253703','REGISTRATION_FEE:10886ad4-baf4-464b-9032-4401b9322390',NULL,'2026-09-16 14:00:05'),('9822ec17-5dbf-44d1-8229-e97b4d07016e','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,25000.00,1,1,'MEMBER_ACTIVATION','0da17060-6e84-4bf9-8978-b00f747dc15c','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788882795542','REGISTRATION_FEE:0da17060-6e84-4bf9-8978-b00f747dc15c',NULL,'2026-09-16 14:00:04'),('99aca06e-b610-49b1-b893-2947803f14c1','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,15000.00,1,1,'MEMBER_ACTIVATION','9781cf3d-b7a2-4e3f-b00b-10fd6c7fb33e','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788877840580','REGISTRATION_FEE:9781cf3d-b7a2-4e3f-b00b-10fd6c7fb33e',NULL,'2026-09-16 14:00:04'),('9a93a382-f633-4018-b426-90d8bdae22fc','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,71000.00,1,1,'MEMBER_ACTIVATION','91dceba9-9f0e-4722-a1b5-4c1e9fb86ef4','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788962256063','REGISTRATION_FEE:91dceba9-9f0e-4722-a1b5-4c1e9fb86ef4',NULL,'2026-09-16 14:00:05'),('9c647c5b-02d9-4892-b6bc-b05b37816ec4','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,38000.00,1,1,'MEMBER_ACTIVATION','bc28d672-c24a-46f3-9b7d-81d3d1a00225','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953689172','REGISTRATION_FEE:bc28d672-c24a-46f3-9b7d-81d3d1a00225',NULL,'2026-09-16 14:00:05'),('a044c87b-e037-4a00-9b3b-16753fa2d149','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,70000.00,1,1,'MEMBER_ACTIVATION','5a3a33f1-85fc-4d55-b1c4-e15da227f290','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788961965626','REGISTRATION_FEE:5a3a33f1-85fc-4d55-b1c4-e15da227f290',NULL,'2026-09-16 14:00:05'),('a148ed5f-42f3-45b0-876c-491422245c75','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,52000.00,1,1,'MEMBER_ACTIVATION','5543ea44-90ed-40ba-9633-b2afc4cc7c5b','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788957378624','REGISTRATION_FEE:5543ea44-90ed-40ba-9633-b2afc4cc7c5b',NULL,'2026-09-16 14:00:05'),('a232af0d-ac37-4b8e-968b-3cc33a4c5196','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,79000.00,1,1,'MEMBER_ACTIVATION','5fda041f-2188-47c5-b6f5-ac4c2bac846c','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788966777868','REGISTRATION_FEE:5fda041f-2188-47c5-b6f5-ac4c2bac846c',NULL,'2026-09-16 14:00:05'),('a2f0fc11-239f-4da5-99f6-2d3c8aa71431','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,64000.00,1,1,'MEMBER_ACTIVATION','3c5e5da5-b74b-4c05-a26d-9c8547d4822d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788960575608','REGISTRATION_FEE:3c5e5da5-b74b-4c05-a26d-9c8547d4822d',NULL,'2026-09-16 14:00:05'),('a424701f-b7b5-4258-85da-c5956cad4a9d','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,51000.00,1,1,'MEMBER_ACTIVATION','264a489f-e4bc-49b5-9713-83a41eb0388a','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788957112014','REGISTRATION_FEE:264a489f-e4bc-49b5-9713-83a41eb0388a',NULL,'2026-09-16 14:00:05'),('a6993401-b4f2-4f10-8b91-1a04b31928e4','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,42000.00,1,1,'MEMBER_ACTIVATION','f7f38717-eb3d-4c2a-913b-ee20504f0549','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788954147262','REGISTRATION_FEE:f7f38717-eb3d-4c2a-913b-ee20504f0549',NULL,'2026-09-16 14:00:05'),('a74bf493-81f7-4dbc-890a-6bec0a07726a','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,28000.00,1,1,'MEMBER_ACTIVATION','208f6539-aef6-428d-9a6b-6ea1bd2605bd','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788952709944','REGISTRATION_FEE:208f6539-aef6-428d-9a6b-6ea1bd2605bd',NULL,'2026-09-16 14:00:04'),('a803d888-7153-4895-a14a-56341c762e6c','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,48000.00,1,1,'MEMBER_ACTIVATION','c004dc05-dcd6-420a-803c-d62e755ee3fc','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788956013244','REGISTRATION_FEE:c004dc05-dcd6-420a-803c-d62e755ee3fc',NULL,'2026-09-16 14:00:05'),('a88cc820-3616-4342-b263-7474dd2e65dc','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,101000.00,1,1,'MEMBER_ACTIVATION','35540088-1f1f-4e9e-86fc-79104fbb3f25','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789028351107','REGISTRATION_FEE:35540088-1f1f-4e9e-86fc-79104fbb3f25',NULL,'2026-09-16 14:00:05'),('abef5e8b-b069-41b0-ab52-8fd0e5ff6aba','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,76000.00,1,1,'MEMBER_ACTIVATION','fe4ee5da-7c5a-4b8e-bcb3-a199fe52386d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788965668345','REGISTRATION_FEE:fe4ee5da-7c5a-4b8e-bcb3-a199fe52386d',NULL,'2026-09-16 14:00:05'),('ad178253-d232-43f1-ba04-d50878b92f16','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,83000.00,1,1,'MEMBER_ACTIVATION','9976f7fa-74ec-4722-9355-4c4cd9153895','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788968295035','REGISTRATION_FEE:9976f7fa-74ec-4722-9355-4c4cd9153895',NULL,'2026-09-16 14:00:05'),('addcbf4b-28e5-48a5-97bd-02dd8e47924a','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,63000.00,1,1,'MEMBER_ACTIVATION','866522a0-d12b-4043-abde-46e12ee96100','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788960385225','REGISTRATION_FEE:866522a0-d12b-4043-abde-46e12ee96100',NULL,'2026-09-16 14:00:05'),('b25fe68c-8b2c-4374-ae1c-e1255d80cdf6','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,10000.00,1,1,'MEMBER_ACTIVATION','9c4a5afe-890d-4e53-a5ae-d092f4d303d4','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788875558732','REGISTRATION_FEE:9c4a5afe-890d-4e53-a5ae-d092f4d303d4',NULL,'2026-09-16 14:00:04'),('b3adb917-ff12-49bd-b838-9745412dd630','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,116000.00,1,1,'MEMBER_ACTIVATION','9e4cec16-f3a3-4dfa-b697-5ed0a8e6ac95','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789035220794','REGISTRATION_FEE:9e4cec16-f3a3-4dfa-b697-5ed0a8e6ac95',NULL,'2026-09-16 14:00:06'),('b3c4785e-5e81-4473-85b2-79f894d81f4b','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,46000.00,1,1,'MEMBER_ACTIVATION','6c3c9d84-6641-4bdd-95f2-7e7bb813e0db','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788955613187','REGISTRATION_FEE:6c3c9d84-6641-4bdd-95f2-7e7bb813e0db',NULL,'2026-09-16 14:00:05'),('b55d3000-9e93-4db3-a368-28add7083b5e','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,90000.00,1,1,'MEMBER_ACTIVATION','b6d36e13-ec2d-426b-ab6d-a540fc74c91e','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788970559931','REGISTRATION_FEE:b6d36e13-ec2d-426b-ab6d-a540fc74c91e',NULL,'2026-09-16 14:00:05'),('b5e5a44b-1632-4a7c-a194-634ec5397d92','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,9000.00,1,1,'MEMBER_ACTIVATION','b9b6e2d7-a7f4-464a-b852-7b62f5878663','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788874866943','REGISTRATION_FEE:b9b6e2d7-a7f4-464a-b852-7b62f5878663',NULL,'2026-09-16 14:00:04'),('b6579dd8-83c8-4d95-9d7c-59d59dc0bd1f','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,136000.00,1,1,'MEMBER_ACTIVATION','14db8a32-793d-4e81-a682-183d55a83360','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789041943918','REGISTRATION_FEE:14db8a32-793d-4e81-a682-183d55a83360',NULL,'2026-09-16 14:00:06'),('b67dd049-a6ca-4868-bf72-fb6d46aaea68','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,17000.00,1,1,'MEMBER_ACTIVATION','08b34078-fc63-4367-bfd9-0f4f8141e3b1','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788879425246','REGISTRATION_FEE:08b34078-fc63-4367-bfd9-0f4f8141e3b1',NULL,'2026-09-16 14:00:04'),('b6ad6f77-1af0-4c5f-a6cd-0d6a7241404f','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,130000.00,1,1,'MEMBER_ACTIVATION','ad6218e0-5708-4e21-90cc-878b02064836','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789040850432','REGISTRATION_FEE:ad6218e0-5708-4e21-90cc-878b02064836',NULL,'2026-09-16 14:00:06'),('b793f76f-32b8-47cc-a004-6e3a17758901','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,39000.00,1,1,'MEMBER_ACTIVATION','48cfd890-0914-4076-a259-03e46486fbeb','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953762811','REGISTRATION_FEE:48cfd890-0914-4076-a259-03e46486fbeb',NULL,'2026-09-16 14:00:05'),('b803c82e-6847-41d3-a6a9-53e8f8cdbe0d','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,35000.00,1,1,'MEMBER_ACTIVATION','986ed510-06ad-4f65-962c-72bb3441eb99','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953395535','REGISTRATION_FEE:986ed510-06ad-4f65-962c-72bb3441eb99',NULL,'2026-09-16 14:00:05'),('b9a87f31-319e-4526-857b-2920990f5625','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,65000.00,1,1,'MEMBER_ACTIVATION','4a4db1fb-8cf8-4df9-b643-e19c8b968340','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788960739102','REGISTRATION_FEE:4a4db1fb-8cf8-4df9-b643-e19c8b968340',NULL,'2026-09-16 14:00:05'),('bda9e2de-66a6-497e-88a8-77db85fb3c1f','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,147000.00,1,1,'MEMBER_ACTIVATION','96c2148a-7005-47ee-a8bc-6098e60b7bc1','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789043933550','REGISTRATION_FEE:96c2148a-7005-47ee-a8bc-6098e60b7bc1',NULL,'2026-09-16 14:00:06'),('be9fbf9b-7574-49ff-8313-5f4cb536024d','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,47000.00,1,1,'MEMBER_ACTIVATION','645c2b01-09de-4a57-8607-b5401fafcfb4','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788955802708','REGISTRATION_FEE:645c2b01-09de-4a57-8607-b5401fafcfb4',NULL,'2026-09-16 14:00:05'),('c041ad95-4a22-415a-8b09-e3cb9fb78143','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,45000.00,1,1,'MEMBER_ACTIVATION','dfaf6650-0edf-4ba1-a80d-f3cf24e0df6a','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788955408442','REGISTRATION_FEE:dfaf6650-0edf-4ba1-a80d-f3cf24e0df6a',NULL,'2026-09-16 14:00:05'),('c217af0e-5330-49a0-9467-a1e7907f69e0','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,20000.00,1,1,'MEMBER_ACTIVATION','3a783381-eb38-4680-ba13-be1f4034b47d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788880216154','REGISTRATION_FEE:3a783381-eb38-4680-ba13-be1f4034b47d',NULL,'2026-09-16 14:00:04'),('c345e781-809e-4217-ab10-e1a4b4ecbbb1','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,74000.00,1,1,'MEMBER_ACTIVATION','94a6c8cc-406c-4907-8542-abe12f21246f','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788963364493','REGISTRATION_FEE:94a6c8cc-406c-4907-8542-abe12f21246f',NULL,'2026-09-16 14:00:05'),('c42831c1-9ae2-40a5-8f4b-34a5d083b39d','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,36000.00,1,1,'MEMBER_ACTIVATION','0b5728a6-6e77-4803-b9f8-4e219a6faa8f','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953469106','REGISTRATION_FEE:0b5728a6-6e77-4803-b9f8-4e219a6faa8f',NULL,'2026-09-16 14:00:05'),('c4d141ab-abe2-40c7-b9a7-073f8bdce92c','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,5000.00,1,1,'MEMBER_ACTIVATION','593e199b-b6df-4898-91b7-3e00e263c119','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788872698476','REGISTRATION_FEE:593e199b-b6df-4898-91b7-3e00e263c119',NULL,'2026-09-16 14:00:04'),('c7654525-0834-4984-bfc8-1a6069959ab7','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,143000.00,1,1,'MEMBER_ACTIVATION','81eee018-fd80-48c9-9e0d-af6e96239e3e','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789043208406','REGISTRATION_FEE:81eee018-fd80-48c9-9e0d-af6e96239e3e',NULL,'2026-09-16 14:00:06'),('ca5b423a-6fd5-4a91-a07b-9c8433f18602','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,110000.00,1,1,'MEMBER_ACTIVATION','0d874cb9-f99b-40c8-b038-1df415c0c126','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789034326196','REGISTRATION_FEE:0d874cb9-f99b-40c8-b038-1df415c0c126',NULL,'2026-09-16 14:00:05'),('cbce7d90-5edf-44f1-a974-56e989976956','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,146000.00,1,1,'MEMBER_ACTIVATION','a5af51cc-2f79-49a6-adaf-0a30c5428338','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789043739272','REGISTRATION_FEE:a5af51cc-2f79-49a6-adaf-0a30c5428338',NULL,'2026-09-16 14:00:06'),('ce106d8f-13ab-4c4a-aa17-554183bfcb36','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,124000.00,1,1,'MEMBER_ACTIVATION','92a251d4-ed3e-47ab-8d2c-248521f0a51e','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789039727912','REGISTRATION_FEE:92a251d4-ed3e-47ab-8d2c-248521f0a51e',NULL,'2026-09-16 14:00:06'),('ceccdac3-6270-4dde-875f-c37bdd037464','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,59000.00,1,1,'MEMBER_ACTIVATION','5cb029d7-6c3d-4107-9cc5-5538de7448fc','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788959492335','REGISTRATION_FEE:5cb029d7-6c3d-4107-9cc5-5538de7448fc',NULL,'2026-09-16 14:00:05'),('cf7e6e6e-eba8-4994-8e6a-402d06941be2','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,73000.00,1,1,'MEMBER_ACTIVATION','567aac30-1354-483c-8c68-5206a15f6090','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788962996969','REGISTRATION_FEE:567aac30-1354-483c-8c68-5206a15f6090',NULL,'2026-09-16 14:00:05'),('d0f74e4c-f4e1-4367-a0e2-1fe65837c531','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,37000.00,1,1,'MEMBER_ACTIVATION','85097b59-ad30-4432-ba3f-1710d48204ac','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953586439','REGISTRATION_FEE:85097b59-ad30-4432-ba3f-1710d48204ac',NULL,'2026-09-16 14:00:05'),('d18ca8a5-66bb-408d-9a84-948c0c9b04fa','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,29000.00,1,1,'MEMBER_ACTIVATION','383a8906-176a-49e3-ba93-348f8be5150b','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788952827658','REGISTRATION_FEE:383a8906-176a-49e3-ba93-348f8be5150b',NULL,'2026-09-16 14:00:05'),('d3eda021-727d-48ed-b658-9089c6952bb0','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,139000.00,1,1,'MEMBER_ACTIVATION','234fda18-4684-4a70-aa99-1b8d7ede3b2f','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789042429763','REGISTRATION_FEE:234fda18-4684-4a70-aa99-1b8d7ede3b2f',NULL,'2026-09-16 14:00:06'),('d4851861-7574-4efc-8beb-94c2fec8169c','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,14000.00,1,1,'MEMBER_ACTIVATION','c7457ba2-5c56-469f-81ca-bb7a9373803d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788877288153','REGISTRATION_FEE:c7457ba2-5c56-469f-81ca-bb7a9373803d',NULL,'2026-09-16 14:00:04'),('d6e363e0-2b78-4ae3-85ec-399afa821683','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,140000.00,1,1,'MEMBER_ACTIVATION','ceec09bf-3ab2-4625-b1f3-e04a8727e13c','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789042619915','REGISTRATION_FEE:ceec09bf-3ab2-4625-b1f3-e04a8727e13c',NULL,'2026-09-16 14:00:06'),('d8ec0f65-4751-4dc7-b498-8d860a45e699','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,93000.00,1,1,'MEMBER_ACTIVATION','03546121-ca8a-4426-9300-dba2ab4e4994','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788972256115','REGISTRATION_FEE:03546121-ca8a-4426-9300-dba2ab4e4994',NULL,'2026-09-16 14:00:05'),('da25d08d-e6dc-4e6b-9463-de6b18208fe9','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,96000.00,1,1,'MEMBER_ACTIVATION','9fd14da0-5691-4045-8085-b69571eadf1f','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788973438992','REGISTRATION_FEE:9fd14da0-5691-4045-8085-b69571eadf1f',NULL,'2026-09-16 14:00:05'),('dcae12da-36f6-4bf2-8b08-8d5c751f31a2','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,31000.00,1,1,'MEMBER_ACTIVATION','cfb7adcc-fc58-40a3-8207-e453137e5984','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953056845','REGISTRATION_FEE:cfb7adcc-fc58-40a3-8207-e453137e5984',NULL,'2026-09-16 14:00:05'),('ddf056a3-6881-443a-9902-01b2c5883754','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,135000.00,1,1,'MEMBER_ACTIVATION','ba5971e6-c954-459a-b552-d6866f36b629','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789041726583','REGISTRATION_FEE:ba5971e6-c954-459a-b552-d6866f36b629',NULL,'2026-09-16 14:00:06'),('decadedc-d559-49ba-978a-b7948f9be21f','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,49000.00,1,1,'MEMBER_ACTIVATION','c11b3152-8933-4933-809f-e5689a41077c','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788956357515','REGISTRATION_FEE:c11b3152-8933-4933-809f-e5689a41077c',NULL,'2026-09-16 14:00:05'),('df3f9073-aa81-435b-a1a7-87784a9e1fbb','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,128000.00,1,1,'MEMBER_ACTIVATION','d0e435f0-a7a3-4dc8-8693-460eb145ad07','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789040533400','REGISTRATION_FEE:d0e435f0-a7a3-4dc8-8693-460eb145ad07',NULL,'2026-09-16 14:00:06'),('e0232f81-6681-4859-adb0-0224fe869b61','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,69000.00,1,1,'MEMBER_ACTIVATION','8dcbb4b6-c861-408c-8867-bf59ab4c77bf','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788961743266','REGISTRATION_FEE:8dcbb4b6-c861-408c-8867-bf59ab4c77bf',NULL,'2026-09-16 14:00:05'),('e069f6da-059f-4a01-9b70-28521826079f','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,133000.00,1,1,'MEMBER_ACTIVATION','fd245c91-605f-4955-ae7e-56058ddc3a7d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789041265038','REGISTRATION_FEE:fd245c91-605f-4955-ae7e-56058ddc3a7d',NULL,'2026-09-16 14:00:06'),('e37bef93-d6ec-4702-ab03-ebd2f898a06e','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,44000.00,1,1,'MEMBER_ACTIVATION','a67c1e45-2923-41b1-9959-f6834cce1c83','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788955214899','REGISTRATION_FEE:a67c1e45-2923-41b1-9959-f6834cce1c83',NULL,'2026-09-16 14:00:05'),('e5a2db6a-1c9e-4ecc-ad0c-ae0a27c2fbf1','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,34000.00,1,1,'MEMBER_ACTIVATION','d8f7d3ec-6eb8-4c1c-a31a-0187b282bf94','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953287519','REGISTRATION_FEE:d8f7d3ec-6eb8-4c1c-a31a-0187b282bf94',NULL,'2026-09-16 14:00:05'),('e8195e0c-6e1b-4e8d-94f0-fa70ae015101','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,107000.00,1,1,'MEMBER_ACTIVATION','192b7726-b9ff-4907-93cd-a03140224321','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789029628346','REGISTRATION_FEE:192b7726-b9ff-4907-93cd-a03140224321',NULL,'2026-09-16 14:00:05'),('ebd9bfa1-0313-4218-b6e2-a4acbdba1b12','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,88000.00,1,1,'MEMBER_ACTIVATION','e490409b-c4d9-4c70-8ccc-d39cbc9b9766','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788969942559','REGISTRATION_FEE:e490409b-c4d9-4c70-8ccc-d39cbc9b9766',NULL,'2026-09-16 14:00:05'),('f10a8e0b-dace-44c7-9254-d4961db118ec','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,40000.00,1,1,'MEMBER_ACTIVATION','1c8bd681-cbc7-4824-b2bc-3de9a98613b7','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788953789592','REGISTRATION_FEE:1c8bd681-cbc7-4824-b2bc-3de9a98613b7',NULL,'2026-09-16 14:00:05'),('f51666a1-50a3-429c-9c5f-79b1a43e4e1a','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,7000.00,1,1,'MEMBER_ACTIVATION','502dd89b-159e-4fd0-804a-58d1963e9ac6','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788873854528','REGISTRATION_FEE:502dd89b-159e-4fd0-804a-58d1963e9ac6',NULL,'2026-09-16 14:00:04'),('f7277478-cc77-403a-b761-6cd985fb5970','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,99000.00,1,1,'MEMBER_ACTIVATION','1c470d20-183e-4c25-9640-6bec5b5db4ca','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788974598618','REGISTRATION_FEE:1c470d20-183e-4c25-9640-6bec5b5db4ca',NULL,'2026-09-16 14:00:05'),('f7cea1bd-322d-48f2-b6ee-a3a84a43041d','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,22000.00,1,1,'MEMBER_ACTIVATION','b6836deb-7d87-4bdc-b4a3-fdcdab80e9c8','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788880875673','REGISTRATION_FEE:b6836deb-7d87-4bdc-b4a3-fdcdab80e9c8',NULL,'2026-09-16 14:00:04'),('f9e5121c-c828-4184-8b8e-b81a2021f936','ETB_MASTER','2026-09-16','2026-09-16 14:00:05','INFLOW','REGISTRATION_FEE',1000.00,95000.00,1,1,'MEMBER_ACTIVATION','7eca5692-46d3-4f81-bfa8-9ac5af1613e3','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788973225142','REGISTRATION_FEE:7eca5692-46d3-4f81-bfa8-9ac5af1613e3',NULL,'2026-09-16 14:00:05'),('fa33fdc6-a7de-48df-91a9-900938ce06a3','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,137000.00,1,1,'MEMBER_ACTIVATION','beb99821-29c5-4e2a-b280-2d5c8aa32c8d','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789042092845','REGISTRATION_FEE:beb99821-29c5-4e2a-b280-2d5c8aa32c8d',NULL,'2026-09-16 14:00:06'),('fb928f9b-6341-497e-952f-bf36bcd419b4','ETB_MASTER','2026-09-16','2026-09-16 14:00:06','INFLOW','REGISTRATION_FEE',1000.00,123000.00,1,1,'MEMBER_ACTIVATION','0814feff-34cb-4b08-9676-a3a43d31a027','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1789037030888','REGISTRATION_FEE:0814feff-34cb-4b08-9676-a3a43d31a027',NULL,'2026-09-16 14:00:06'),('fd030a6d-ad22-43e6-aae4-1f9fa5d77eca','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,8000.00,1,1,'MEMBER_ACTIVATION','6c1309a3-c4d6-479e-847d-b078d7905d70','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788874506095','REGISTRATION_FEE:6c1309a3-c4d6-479e-847d-b078d7905d70',NULL,'2026-09-16 14:00:04'),('fde28fd8-085f-474f-ad28-53ba671028a6','ETB_MASTER','2026-09-16','2026-09-16 14:00:04','INFLOW','REGISTRATION_FEE',1000.00,13000.00,1,1,'MEMBER_ACTIVATION','b88df60c-58e3-424a-92a1-6b57933f6485','REGISTRATION_FEE',NULL,'710299d7-7dfd-435d-8a1e-717ce51e5ede','Registration fee recognized on first activation of MEM-1788876923824','REGISTRATION_FEE:b88df60c-58e3-424a-92a1-6b57933f6485',NULL,'2026-09-16 14:00:04');
/*!40000 ALTER TABLE `sacco_master_ledger` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`alefdelta_admin`@`%`*/ /*!50003 TRIGGER `trg_sacco_master_ledger_no_update` BEFORE UPDATE ON `sacco_master_ledger` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SACCO master ledger entries are append-only and cannot be updated' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`alefdelta_admin`@`%`*/ /*!50003 TRIGGER `trg_sacco_master_ledger_no_delete` BEFORE DELETE ON `sacco_master_ledger` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SACCO master ledger entries are append-only and cannot be deleted' */;;
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
INSERT INTO `schema_migrations` VALUES ('01_init_schema.sql','2026-08-31 22:05:44'),('02_add_indexes.sql','2026-08-31 22:05:44'),('03_add_verification_fields.sql','2026-08-31 22:05:45'),('04_add_id_card_separate_fields.sql','2026-08-31 22:05:45'),('05_add_beneficiary_profile_photo.sql','2026-08-31 22:05:45'),('06_add_guarantor_profile_and_duty.sql','2026-08-31 22:05:45'),('07_update_guarantors_to_standalone.sql','2026-08-31 22:05:45'),('08_add_pending_status_to_members.sql','2026-08-31 22:05:45'),('09_add_category_to_loan_products.sql','2026-08-31 22:05:45'),('10_create_account_products.sql','2026-08-31 22:05:45'),('11_expand_account_products.sql','2026-08-31 22:05:45'),('12_add_system_jobs_and_takaful.sql','2026-08-31 22:05:45'),('13_create_deposit_requests.sql','2026-08-31 22:05:45'),('14_collateral_multiple_documents.sql','2026-08-31 22:05:45'),('14_create_loan_repayment_requests.sql','2026-08-31 22:05:45'),('15_add_quarterly_repayment.sql','2026-08-31 22:05:45'),('16_create_loan_repayments.sql','2026-08-31 22:05:46'),('17_add_penalty_tracking.sql','2026-08-31 22:05:46'),('17_create_notifications.sql','2026-08-31 22:05:46'),('18_add_interest_tracking.sql','2026-08-31 22:05:46'),('19_add_member_inactivity_tracking.sql','2026-08-31 22:05:46'),('20_update_member_registration_fields.sql','2026-08-31 22:05:47'),('21_create_emergency_contacts.sql','2026-08-31 22:05:47'),('22_create_member_documents.sql','2026-08-31 22:05:47'),('23_add_registration_receipt_document_type.sql','2026-08-31 22:05:47'),('24_create_member_registration_requests.sql','2026-08-31 22:05:47'),('25_add_teller_approved_status.sql','2026-08-31 22:05:47'),('26_add_age_to_guarantors.sql','2026-08-31 22:05:47'),('27_add_share_price_config.sql','2026-08-31 22:05:47'),('28_add_bank_receipt_to_loan_repayments.sql','2026-08-31 22:05:47'),('29_create_partner_requests.sql','2026-08-31 22:05:47'),('30_create_loan_requests.sql','2026-08-31 22:05:47'),('31_add_tier_fields_to_loan_products.sql','2026-08-31 22:05:47'),('32_seed_loan_tiers.sql','2026-08-31 22:05:47'),('33_add_eligible_savings_types.sql','2026-08-31 22:05:47'),('34_create_loan_amortization_schedule.sql','2026-08-31 22:05:47'),('35_add_loan_penalty_policy.sql','2026-08-31 22:05:47'),('36_add_board_loan_approval_workflow.sql','2026-08-31 22:05:47'),('37_add_loan_penalty_rate_snapshot.sql','2026-08-31 22:05:48'),('38_add_loan_service_charge_policy.sql','2026-08-31 22:05:48'),('39_add_loan_insurance.sql','2026-08-31 22:05:48'),('40_create_loan_insurance_rate_matrix.sql','2026-08-31 22:05:48'),('41_add_dynamic_loan_tiers.sql','2026-08-31 22:05:48'),('42_add_profit_distribution_and_master_ledger.sql','2026-08-31 22:05:48'),('43_protect_master_ledger.sql','2026-08-31 22:06:34'),('44_name_profit_distribution_buckets.sql','2026-08-31 22:06:34'),('45_add_loan_upfront_fees_and_insurance_closure.sql','2026-08-31 22:06:34');
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
INSERT INTO `system_config` VALUES ('inactivity_check_enabled','true','Enable automatic inactivity status updates',NULL,'2026-08-31 22:05:46'),('loan_insurance_discount_pct','0','Optional reduction from the insurance ceiling rate; must be 0 or greater and can never increase the matrix rate',NULL,'2026-08-31 22:05:48'),('loan_insurance_enabled','true','Enable mandatory loan life insurance calculation',NULL,'2026-08-31 22:05:48'),('member_inactive_days','90','Days of inactivity before member becomes INACTIVE (default 90 = 3 months)',NULL,'2026-08-31 22:05:46'),('member_terminated_days','365','Days of inactivity before member becomes TERMINATED (default 365 = 1 year)',NULL,'2026-08-31 22:05:46'),('min_shares_required','10','Minimum shares required for membership (used to compute member share lien)','710299d7-7dfd-435d-8a1e-717ce51e5ede','2026-09-16 13:33:18'),('penalty_rate_default','10','Default penalty rate for overdue loans (%)','710299d7-7dfd-435d-8a1e-717ce51e5ede','2026-09-16 13:32:39'),('registration_fee_etb','1000','Registration fee recognized as SACCO revenue on first member activation',NULL,'2026-08-31 22:05:48'),('share_price','300','Share price in ETB (used to compute member share lien)',NULL,'2026-08-31 22:05:47');
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
INSERT INTO `users` VALUES ('18fd21ec-bbcf-4461-ae69-0a1013717e15','manager','$2b$12$Pmopcqy5eUJUZLZAwdAwiOXpuX1NQ4BoeKunDY3ZiztYwxdOX9nca','MANAGER','sacco-manager@alefdelta.com','+251988888000','ACTIVE',NULL,0,'2026-09-01 09:17:57','2026-09-01 09:17:57'),('209ff2a0-8645-431f-8036-eab00194703a','board-member','$2b$12$f26KOoEJios4aox1/JumU.LsDwsIxPcAwlEZYSrXgyvl01mNrXPyW','BOARD_MEMBER','sacco-board-member@alefdelta.com','+251988888000','ACTIVE',NULL,0,'2026-09-01 09:20:03','2026-09-01 09:20:03'),('710299d7-7dfd-435d-8a1e-717ce51e5ede','admin','$2b$12$JCJsmKCfxnVnBVdg58ynlOAKs/hpVxYJ40DansdT6IT/o5sIaIVrK','ADMIN','sacco@alefdelta.com','+251900000000','ACTIVE',NULL,0,'2026-08-31 22:06:55','2026-08-31 22:22:29'),('abdba51d-41be-4d3a-b7a5-620de9fadfc4','teller-01','$2b$12$.XhocDsUalApv46ZvU5gcu7PNG7sRxZ2vLZ/0imnzzBNSk3zxBnU.','TELLER','sacco-teller@alefdelta.com','+251988888222','ACTIVE',NULL,0,'2026-09-01 09:12:01','2026-09-01 09:12:01'),('ba7f3277-b652-443d-99b1-968f5dd7fbc0','credit-officer-01','$2b$12$w4Nv8qAnAEfoYEl0gO/53O9d7tJ6j6a.ahKtsy5Hq3ndsj50FGdw.','CREDIT_OFFICER','sacco-credit-officer@alefdelta.com','+251988888111','ACTIVE',NULL,0,'2026-09-01 09:16:09','2026-09-01 09:16:09');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'alef_delta_sacco'
--

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

-- Dump completed on 2026-09-16 17:09:16
