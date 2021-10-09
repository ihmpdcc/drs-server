/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `access_methods`
--

DROP TABLE IF EXISTS `access_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `access_methods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `blob_id` int(11) NOT NULL,
  `type` enum('s3','gs','ftp','gsiftp','globus','htsget','https','file') NOT NULL,
  `url` mediumtext NOT NULL,
  `region` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `blobid_idx` (`blob_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `access_methods`
--

LOCK TABLES `access_methods` WRITE;
/*!40000 ALTER TABLE `access_methods` DISABLE KEYS */;
INSERT INTO `access_methods` VALUES (1,1,'https','https://servera/path/to/blob_a',NULL),(2,1,'s3','s3://hmpdacc/blob_a','us-east-1'),(3,1,'gs','gs://hmpdacc/data/blob_a',NULL),(4,2,'https','https://serverb/path/to/blob_b',NULL),(5,3,'s3','s3://hmpdacc/blob_c','us-east-1');
/*!40000 ALTER TABLE `access_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `containerships`
--

DROP TABLE IF EXISTS `containerships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `containerships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `parentage_uniq` (`object_id`,`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `containerships`
--

LOCK TABLES `containerships` WRITE;
/*!40000 ALTER TABLE `containerships` DISABLE KEYS */;
INSERT INTO `containerships` VALUES (1,1,5),(2,2,5),(3,3,5),(4,7,6),(5,8,6),(6,9,8),(7,10,8),(9,11,8);
/*!40000 ALTER TABLE `containerships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `headers`
--

DROP TABLE IF EXISTS `headers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `headers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `access_method_id` int(11) NOT NULL,
  `name` varchar(32) NOT NULL,
  `value` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `header_name_uniq` (`access_method_id`,`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `headers`
--

LOCK TABLES `headers` WRITE;
/*!40000 ALTER TABLE `headers` DISABLE KEYS */;
INSERT INTO `headers` VALUES (1,1,'Authorization','whatever'),(2,1,'AnotherHeader','foobar');
/*!40000 ALTER TABLE `headers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objects`
--

DROP TABLE IF EXISTS `objects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `objects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `drs_id` varchar(64) NOT NULL,
  `name` varchar(64) DEFAULT NULL,
  `description` varchar(512) DEFAULT NULL,
  `size` bigint(20) NOT NULL,
  `mime_type` varchar(32) DEFAULT NULL,
  `md5_checksum` char(32) NOT NULL,
  `sha256_checksum` char(64) DEFAULT NULL,
  `created_time` datetime NOT NULL,
  `updated_time` datetime DEFAULT NULL,
  `version` varchar(16) DEFAULT NULL,
  `is_blob` enum('yes','no') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `drs_id_uniq` (`drs_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objects`
--

LOCK TABLES `objects` WRITE;
/*!40000 ALTER TABLE `objects` DISABLE KEYS */;
INSERT INTO `objects` VALUES (1,'blob_a','Blob A','The first blob',43271233281,NULL,'7fc56270e7a70fa81a5935b72eacbe29',NULL,'2021-09-13 00:00:00',NULL,'1','yes'),(2,'blob_b','Blob B',NULL,3245257181,NULL,'9d5ed678fe57bcca610140957afab571','df7e70e5021544f4834bbee64a9e3789febc4be81470df629cad6ddb03320a5c','2021-09-13 13:37:29',NULL,NULL,'yes'),(3,'blob_c','Blob C',NULL,7483154909,NULL,'0d61f8370cad1d412f80b84d143e1257',NULL,'2021-09-13 13:39:04',NULL,NULL,'yes'),(4,'blob_d','Blob D',NULL,95376212,NULL,'f623e75af30e62bbd73d6df5b50bb7b5',NULL,'2021-09-13 13:50:59',NULL,NULL,'yes'),(5,'bundle_1','Bundle 1',NULL,5212685564,NULL,'79a58ab10b666b30ec664097e06bb110',NULL,'2021-09-13 13:57:51',NULL,NULL,'no'),(6,'bundle_2','Bundle 2',NULL,33584098,NULL,'5affb6879844a996adc728025f00aa1f',NULL,'2021-09-13 14:04:09',NULL,NULL,'no'),(7,'blob_e','Blob E',NULL,7421718216,NULL,'3a3ea00cfc35332cedf6e5e9a32e94da',NULL,'2021-09-13 14:08:21',NULL,NULL,'yes'),(8,'bundle_2.1','Bundle 2.1','A sub bundle.',2856688870,NULL,'0d599f0ec05c3bda8c3b8a68c32a1b47',NULL,'2021-09-22 11:00:53',NULL,NULL,'no'),(9,'blob_f.1','Blob F.1',NULL,9351778080,NULL,'b8bf8301cc292457b6bf98c3ad82c311',NULL,'2021-09-22 11:03:19',NULL,NULL,'yes'),(10,'blob_f.2','Blob F.2',NULL,7530922176,NULL,'d2ad383906e579ba862df2e77464b32f',NULL,'2021-09-22 11:04:09',NULL,NULL,'yes'),(11,'blob_f.3','Blob F.3',NULL,8964010230,NULL,'461eb21a7331b944f730e8183651ab73',NULL,'2021-09-22 11:06:51',NULL,NULL,'yes');
/*!40000 ALTER TABLE `objects` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
