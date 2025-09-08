-- MySQL dump 10.13  Distrib 9.4.0, for Linux (aarch64)
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
  `status` enum('NEW','FINISHED','REJECTED','PROCESSING','CLAIMED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `hashId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` int DEFAULT NULL,
  `from` datetime(3) NOT NULL,
  `to` datetime(3) NOT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `status` enum('NEW','FINISHED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NEW',
  `amount` double NOT NULL DEFAULT '0',
  `userId` int DEFAULT NULL,
  `hashId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `network` enum('ERC20','SOLANA','BEP20') COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `side` enum('SELL','BUY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entryPrice` double NOT NULL,
  `qty` double NOT NULL,
  `budget` double NOT NULL,
  `status` enum('ACTIVE','EXPIRED','FINISHED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `netProfit` double NOT NULL DEFAULT '0',
  `markPrice` double DEFAULT NULL,
  `strategyId` int NOT NULL,
  `currentTargetId` int DEFAULT NULL,
  `tokenId` int NOT NULL,
  `fee` double NOT NULL DEFAULT '0',
  `stoplossOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Order`
--

LOCK TABLES `Order` WRITE;
/*!40000 ALTER TABLE `Order` DISABLE KEYS */;
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
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contribution` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '0',
  `isCloseBeforeNewCandle` tinyint(1) NOT NULL DEFAULT '0',
  `direction` enum('SAME','OPPOSITE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SAME',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `parentStrategy` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Strategy`
--

LOCK TABLES `Strategy` WRITE;
/*!40000 ALTER TABLE `Strategy` DISABLE KEYS */;
INSERT INTO `Strategy` VALUES (1,'',100,1,0,'OPPOSITE','2025-09-08 19:03:58.929','2025-09-08 19:03:58.929',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Target`
--

LOCK TABLES `Target` WRITE;
/*!40000 ALTER TABLE `Target` DISABLE KEYS */;
INSERT INTO `Target` VALUES (1,0,-1.6,1,1,'2025-09-08 19:06:42.158','2025-09-08 19:06:42.158'),(2,1,1,1,1,'2025-09-08 19:07:09.095','2025-09-08 19:07:09.095');
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
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stable` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minQty` double NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `leverage` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Token_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Token`
--

LOCK TABLES `Token` WRITE;
/*!40000 ALTER TABLE `Token` DISABLE KEYS */;
INSERT INTO `Token` VALUES (1,'SOL','USDT',0.01,1,'2025-09-08 19:02:01.386','2025-09-08 19:02:01.386',1);
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TokenStrategy`
--

LOCK TABLES `TokenStrategy` WRITE;
/*!40000 ALTER TABLE `TokenStrategy` DISABLE KEYS */;
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
  `fullname` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profit` double NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '0',
  `isVerified` tinyint(1) NOT NULL DEFAULT '0',
  `avatar` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `tradeBalance` int NOT NULL DEFAULT '0',
  `telegramChatId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adminCommissionPercent` double NOT NULL DEFAULT '0.3',
  `adminInsurance` double NOT NULL DEFAULT '0',
  `insurancePercent` double NOT NULL DEFAULT '0',
  `referralCode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referralCommissionPercent` double NOT NULL DEFAULT '0',
  `referralInsurance` double NOT NULL DEFAULT '0',
  `referralUserId` int DEFAULT NULL,
  `apiKey` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apiPassphrase` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apiSecret` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
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
INSERT INTO `User` VALUES (1,'minh c nguyen','chienminh5298','chienminh5298@gmail.com','wefweF',0,1,0,0,'2025-09-08 19:13:42.122','2025-09-08 19:13:42.122',0,NULL,0.3,0,0,'a',0,0,NULL,'',NULL,'');
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
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` int NOT NULL,
  `activeDate` datetime(3) DEFAULT NULL,
  `effectDate` datetime(3) NOT NULL,
  `expireDate` datetime(3) NOT NULL,
  `status` enum('inuse','expired','unused') COLLATE utf8mb4_unicode_ci NOT NULL,
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

-- Dump completed on 2025-09-08 19:15:40
