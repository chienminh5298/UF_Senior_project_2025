-- MySQL dump 10.13  Distrib 9.4.0, for Linux (x86_64)
--
-- Host: localhost    Database: moneymachine
-- ------------------------------------------------------
-- Server version	9.4.0

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
-- Table structure for table `Bill`
--

DROP TABLE IF EXISTS `Bill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Bill` (
  `id` int NOT NULL AUTO_INCREMENT,
  `adminCommissionPercent` double NOT NULL DEFAULT '30',
  `referralCommissionPercent` double NOT NULL DEFAULT '0',
  `referralUserId` int DEFAULT NULL,
  `status` enum('NEW','FINISHED','REJECTED','PROCESSING','CLAIMED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hashId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` int DEFAULT NULL,
  `from` datetime(3) NOT NULL,
  `to` datetime(3) NOT NULL,
  `note` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `netProfit` double NOT NULL DEFAULT '0',
  `claimId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Bill_userId_fkey` (`userId`),
  KEY `Bill_claimId_fkey` (`claimId`),
  CONSTRAINT `Bill_claimId_fkey` FOREIGN KEY (`claimId`) REFERENCES `Claim` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Bill_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Bill`
--

LOCK TABLES `Bill` WRITE;
/*!40000 ALTER TABLE `Bill` DISABLE KEYS */;
/*!40000 ALTER TABLE `Bill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Claim`
--

DROP TABLE IF EXISTS `Claim`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Claim` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` enum('NEW','FINISHED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NEW',
  `amount` double NOT NULL DEFAULT '0',
  `userId` int DEFAULT NULL,
  `hashId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `network` enum('ERC20','SOLANA','BEP20') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adminNote` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Claim_userId_fkey` (`userId`),
  CONSTRAINT `Claim_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Claim`
--

LOCK TABLES `Claim` WRITE;
/*!40000 ALTER TABLE `Claim` DISABLE KEYS */;
/*!40000 ALTER TABLE `Claim` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Order`
--

DROP TABLE IF EXISTS `Order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Order` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `side` enum('SELL','BUY') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entryPrice` double NOT NULL,
  `qty` double NOT NULL,
  `budget` double NOT NULL,
  `status` enum('ACTIVE','EXPIRED','FINISHED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `netProfit` double NOT NULL DEFAULT '0',
  `markPrice` double DEFAULT NULL,
  `strategyId` int NOT NULL,
  `currentTargetId` int DEFAULT NULL,
  `tokenId` int NOT NULL,
  `fee` double NOT NULL DEFAULT '0',
  `stoplossOrderId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `billId` int DEFAULT NULL,
  `userId` int NOT NULL,
  `leverage` int NOT NULL DEFAULT '1',
  `buyDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sellDate` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Order_orderId_key` (`orderId`),
  KEY `Order_strategyId_fkey` (`strategyId`),
  KEY `Order_currentTargetId_fkey` (`currentTargetId`),
  KEY `Order_tokenId_fkey` (`tokenId`),
  KEY `Order_userId_fkey` (`userId`),
  KEY `Order_billId_fkey` (`billId`),
  CONSTRAINT `Order_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `Bill` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_currentTargetId_fkey` FOREIGN KEY (`currentTargetId`) REFERENCES `Target` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_strategyId_fkey` FOREIGN KEY (`strategyId`) REFERENCES `Strategy` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Order_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `Token` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Order`
--

LOCK TABLES `Order` WRITE;
/*!40000 ALTER TABLE `Order` DISABLE KEYS */;
INSERT INTO `Order` VALUES (16,'151054901266','SELL','1759513447379',232.02,0.34,78.88680000000001,'FINISHED',-0.004049400000000397,231.8,1,2,1,0.07884940000000001,NULL,'2025-10-03 17:44:09.350','2025-10-03 17:45:24.445',NULL,1,1,'2025-10-03 17:44:09.350',NULL),(17,'160495397461','SELL','1761054549656',184.08,0.42,77.31360000000001,'FINISHED',-0.07731360000000001,184.08,1,2,1,0.07731360000000001,'160495575466','2025-10-21 13:49:12.138','2025-10-21 13:49:35.517',NULL,1,1,'2025-10-21 13:49:12.138',NULL),(21,'160516328897','SELL','1761057669067',188.79,0.4,75.516,'FINISHED',-0.1595580000000032,189,1,2,1,0.07555800000000001,NULL,'2025-10-21 14:41:11.637','2025-10-21 14:43:08.479',NULL,1,1,'2025-10-21 14:41:11.637',NULL),(22,'160736090183','BUY','1761091214694',185.44,0.36,66.7584,'FINISHED',-0.09194579999999754,185.37,1,2,1,0.0667458,NULL,'2025-10-22 00:00:18.084','2025-10-22 00:00:32.115',NULL,1,1,'2025-10-22 00:00:18.084',NULL),(23,'160916555761','BUY','1761120006140',184.82,0.4,73.928,'FINISHED',-0.1259019999999982,184.69,1,2,1,0.073902,NULL,'2025-10-22 08:00:09.591','2025-10-22 08:00:23.602',NULL,1,1,'2025-10-22 08:00:09.591',NULL),(24,'161117847346','BUY','1761148814588',183.89,0.36,66.20039999999999,'FINISHED',-1.192436999999998,180.76,1,2,1,0.065637,'161117871553','2025-10-22 16:00:16.310','2025-10-22 18:14:38.001',NULL,1,1,'2025-10-22 16:00:16.310',NULL),(25,'161317443386','BUY','1761177605707',179.94,0.4,71.976,'FINISHED',0.651662000000001,181.75,1,2,1,0.072338,NULL,'2025-10-23 00:00:09.098','2025-10-23 01:14:21.730',NULL,1,1,'2025-10-23 00:00:09.098',NULL),(26,'161490476027','BUY','1761206409724',187.43,0.34,63.72620000000001,'FINISHED',-0.0739211000000004,187.4,1,2,1,0.06372110000000002,'161496067114','2025-10-23 08:00:11.437','2025-10-23 09:04:53.089',NULL,1,1,'2025-10-23 08:00:11.437',NULL),(27,'161669072936','BUY','1761235212020',191.02,0.33,63.03660000000001,'FINISHED',0.3162736499999925,192.17,1,2,1,0.06322635000000001,NULL,'2025-10-23 16:00:13.732','2025-10-23 16:54:41.174',NULL,1,1,'2025-10-23 16:00:13.732',NULL),(28,'161838623163','SELL','1761264005595',191.28,0.37,70.7736,'FINISHED',-0.0707736,191.28,1,2,1,0.0707736,NULL,'2025-10-24 00:00:10.649','2025-10-24 00:00:24.647',NULL,1,1,'2025-10-24 00:00:10.649',NULL),(29,'162008800375','SELL','1761292805667',192.1,0.36,69.15599999999999,'FINISHED',-0.0871650000000041,192.15,1,2,1,0.069165,NULL,'2025-10-24 08:00:09.040','2025-10-24 08:00:23.067',NULL,1,1,'2025-10-24 08:00:09.040',NULL),(30,'162178595893','SELL','1761321611021',189.34,0.32,60.5888,'FINISHED',-0.04778240000000256,189.3,1,2,1,0.06058240000000001,NULL,'2025-10-24 16:00:12.730','2025-10-24 16:00:26.780',NULL,1,1,'2025-10-24 16:00:12.730',NULL),(31,'162326778528','SELL','1761350410055',193.38,0.31,59.9478,'FINISHED',-0.06925245000000035,193.41,1,2,1,0.05995245,NULL,'2025-10-25 00:00:11.767','2025-10-25 00:00:25.766',NULL,1,1,'2025-10-25 00:00:11.767',NULL),(32,'162474740849','SELL','1761379205942',193.87,0.34,65.9158,'FINISHED',-0.05230900000000273,193.83,1,2,1,0.06590900000000002,NULL,'2025-10-25 08:00:07.643','2025-10-25 08:00:21.689',NULL,1,1,'2025-10-25 08:00:07.643',NULL),(33,'162627925354','SELL','1761408008827',191.79,0.34,65.2086,'FINISHED',-0.06861030000000656,191.8,1,2,1,0.0652103,NULL,'2025-10-25 16:00:10.726','2025-10-25 16:00:24.810',NULL,1,1,'2025-10-25 16:00:10.726',NULL),(34,'162769324434','SELL','1761436805592',193.73,0.33,63.9309,'FINISHED',-0.0639309,193.73,1,2,1,0.0639309,NULL,'2025-10-26 00:00:08.967','2025-10-26 00:00:22.976',NULL,1,1,'2025-10-26 00:00:08.967',NULL),(35,'162907865340','SELL','1761465605482',193.86,0.33,63.9738,'FINISHED',-0.08378369999999138,193.92,1,2,1,0.0639837,NULL,'2025-10-26 08:00:08.872','2025-10-26 08:00:22.871',NULL,1,1,'2025-10-26 08:00:08.872',NULL),(36,'163083618742','SELL','1761494406589',199.41,0.31,61.8171,'FINISHED',-0.04941090000000247,199.37,1,2,1,0.0618109,NULL,'2025-10-26 16:00:09.788','2025-10-26 16:00:24.705',NULL,1,1,'2025-10-26 16:00:09.788',NULL),(37,'163246502640','SELL','1761523206232',200,0.31,62,'FINISHED',-0.04339069999999929,199.94,1,2,1,0.0619907,NULL,'2025-10-27 00:00:09.603','2025-10-27 00:00:23.608',NULL,1,1,'2025-10-27 00:00:09.603',NULL);
/*!40000 ALTER TABLE `Order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Strategy`
--

DROP TABLE IF EXISTS `Strategy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Strategy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contribution` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '0',
  `isCloseBeforeNewCandle` tinyint(1) NOT NULL DEFAULT '0',
  `direction` enum('SAME','OPPOSITE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SAME',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `parentStrategy` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Strategy`
--

LOCK TABLES `Strategy` WRITE;
/*!40000 ALTER TABLE `Strategy` DISABLE KEYS */;
INSERT INTO `Strategy` VALUES (1,'',100,1,0,'OPPOSITE','2025-09-08 19:03:58.929','2025-09-08 19:03:58.929',NULL),(2,'trigger',100,1,0,'OPPOSITE','2025-09-08 19:03:58.929','2025-09-08 19:03:58.929',1);
/*!40000 ALTER TABLE `Strategy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Target`
--

DROP TABLE IF EXISTS `Target`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Target` (
  `id` int NOT NULL AUTO_INCREMENT,
  `targetPercent` double NOT NULL DEFAULT '0',
  `stoplossPercent` double NOT NULL DEFAULT '0',
  `tokenId` int DEFAULT NULL,
  `strategyId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Target_tokenId_fkey` (`tokenId`),
  KEY `Target_strategyId_fkey` (`strategyId`),
  CONSTRAINT `Target_strategyId_fkey` FOREIGN KEY (`strategyId`) REFERENCES `Strategy` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Target_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `Token` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Target`
--

LOCK TABLES `Target` WRITE;
/*!40000 ALTER TABLE `Target` DISABLE KEYS */;
INSERT INTO `Target` VALUES (1,0,-1.85,1,1,'2025-09-08 19:06:42.158','2025-09-08 19:06:42.158'),(2,0.6,0.6,1,1,'2025-09-08 19:07:09.095','2025-09-08 19:07:09.095'),(3,0,-1.5,1,2,'2025-09-08 19:00:00.000','2025-09-08 19:06:42.158'),(4,3,3,1,2,'2025-09-08 19:00:00.000','2025-09-08 19:06:42.158');
/*!40000 ALTER TABLE `Target` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Token`
--

DROP TABLE IF EXISTS `Token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stable` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `minQty` double NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `leverage` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Token_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Token`
--

LOCK TABLES `Token` WRITE;
/*!40000 ALTER TABLE `Token` DISABLE KEYS */;
INSERT INTO `Token` VALUES (1,'SOL','USDT',0.03,1,'2025-09-08 19:02:01.386','2025-09-08 19:02:01.386',1),(2,'ETH','USDT',0.01,1,'2023-09-29 20:08:51.000','2023-09-29 20:00:00.000',2),(3,'BTC','USDT',0.002,1,'2023-09-29 20:00:00.000','2023-09-20 20:00:00.000',2);
/*!40000 ALTER TABLE `Token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TokenStrategy`
--

DROP TABLE IF EXISTS `TokenStrategy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TokenStrategy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tokenId` int DEFAULT NULL,
  `strategyId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `TokenStrategy_tokenId_fkey` (`tokenId`),
  KEY `TokenStrategy_strategyId_fkey` (`strategyId`),
  CONSTRAINT `TokenStrategy_strategyId_fkey` FOREIGN KEY (`strategyId`) REFERENCES `Strategy` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `TokenStrategy_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `Token` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TokenStrategy`
--

LOCK TABLES `TokenStrategy` WRITE;
/*!40000 ALTER TABLE `TokenStrategy` DISABLE KEYS */;
INSERT INTO `TokenStrategy` VALUES (1,1,1,'2025-10-02 14:10:32.654','2025-09-08 11:11:22.729'),(2,1,NULL,'2025-10-20 18:58:26.643','2025-10-20 18:58:26.643');
/*!40000 ALTER TABLE `TokenStrategy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `profit` double NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '0',
  `isVerified` tinyint(1) NOT NULL DEFAULT '0',
  `avatar` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `tradeBalance` int NOT NULL DEFAULT '0',
  `telegramChatId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adminCommissionPercent` double NOT NULL DEFAULT '0.3',
  `adminInsurance` double NOT NULL DEFAULT '0',
  `insurancePercent` double NOT NULL DEFAULT '0',
  `referralCode` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `referralCommissionPercent` double NOT NULL DEFAULT '0',
  `referralInsurance` double NOT NULL DEFAULT '0',
  `referralUserId` int DEFAULT NULL,
  `apiKey` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apiPassphrase` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apiSecret` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_username_key` (`username`),
  UNIQUE KEY `User_email_key` (`email`),
  UNIQUE KEY `User_referralCode_key` (`referralCode`),
  UNIQUE KEY `User_apiKey_key` (`apiKey`),
  UNIQUE KEY `User_apiSecret_key` (`apiSecret`),
  UNIQUE KEY `User_apiPassphrase_key` (`apiPassphrase`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,'minh c nguyen','chienminh5298','chienminh5298@gmail.com','$2a$12$44N/zbAmXf5PebSuJ8vUH.nT3Aze45k4O.Maul019bIjojxFOAysO',0,1,0,0,'2025-09-08 19:13:42.122','2025-10-27 00:00:23.617',61,NULL,0.3,0,0,'a',0,0,NULL,'',NULL,'');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserToken`
--

DROP TABLE IF EXISTS `UserToken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserToken` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `tokenId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `UserToken_userId_fkey` (`userId`),
  KEY `UserToken_tokenId_fkey` (`tokenId`),
  CONSTRAINT `UserToken_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `Token` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `UserToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserToken`
--

LOCK TABLES `UserToken` WRITE;
/*!40000 ALTER TABLE `UserToken` DISABLE KEYS */;
INSERT INTO `UserToken` VALUES (1,1,1,'2025-09-08 19:15:22.749','2025-09-08 19:15:22.749');
/*!40000 ALTER TABLE `UserToken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Voucher`
--

DROP TABLE IF EXISTS `Voucher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Voucher` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` int NOT NULL,
  `activeDate` datetime(3) DEFAULT NULL,
  `effectDate` datetime(3) NOT NULL,
  `expireDate` datetime(3) NOT NULL,
  `status` enum('inuse','expired','unused') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Voucher_code_key` (`code`),
  KEY `Voucher_userId_fkey` (`userId`),
  CONSTRAINT `Voucher_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Voucher`
--

LOCK TABLES `Voucher` WRITE;
/*!40000 ALTER TABLE `Voucher` DISABLE KEYS */;
/*!40000 ALTER TABLE `Voucher` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-27  6:28:23
