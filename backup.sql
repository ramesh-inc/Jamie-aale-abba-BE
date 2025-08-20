-- MySQL dump 10.13  Distrib 9.4.0, for macos15.4 (arm64)
--
-- Host: localhost    Database: classdojo_db
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
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissions` json NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `admins_user_id_b3ea64ed_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `allowed_message_contacts`
--

DROP TABLE IF EXISTS `allowed_message_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allowed_message_contacts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `parent_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `teacher_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `allowed_message_contacts_parent_id_teacher_id_stu_0a0011e2_uniq` (`parent_id`,`teacher_id`,`student_id`),
  KEY `allowed_message_contacts_student_id_b14e52bc_fk_students_id` (`student_id`),
  KEY `allowed_message_contacts_teacher_id_7e13570d_fk_teachers_id` (`teacher_id`),
  CONSTRAINT `allowed_message_contacts_parent_id_94774eda_fk_parents_id` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`),
  CONSTRAINT `allowed_message_contacts_student_id_b14e52bc_fk_students_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `allowed_message_contacts_teacher_id_7e13570d_fk_teachers_id` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allowed_message_contacts`
--

LOCK TABLES `allowed_message_contacts` WRITE;
/*!40000 ALTER TABLE `allowed_message_contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `allowed_message_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` char(39) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_752b0e2b_fk_users_id` (`user_id`),
  CONSTRAINT `audit_logs_user_id_752b0e2b_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `audit_logs_chk_1` CHECK ((`entity_id` >= 0))
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
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add user',6,'add_user'),(22,'Can change user',6,'change_user'),(23,'Can delete user',6,'delete_user'),(24,'Can view user',6,'view_user'),(25,'Can add teacher',7,'add_teacher'),(26,'Can change teacher',7,'change_teacher'),(27,'Can delete teacher',7,'delete_teacher'),(28,'Can view teacher',7,'view_teacher'),(29,'Can add admin',8,'add_admin'),(30,'Can change admin',8,'change_admin'),(31,'Can delete admin',8,'delete_admin'),(32,'Can view admin',8,'view_admin'),(33,'Can add parent',9,'add_parent'),(34,'Can change parent',9,'change_parent'),(35,'Can delete parent',9,'delete_parent'),(36,'Can view parent',9,'view_parent'),(37,'Can add class',10,'add_class'),(38,'Can change class',10,'change_class'),(39,'Can delete class',10,'delete_class'),(40,'Can view class',10,'view_class'),(41,'Can add student',11,'add_student'),(42,'Can change student',11,'change_student'),(43,'Can delete student',11,'delete_student'),(44,'Can view student',11,'view_student'),(45,'Can add class student enrollment',12,'add_classstudentenrollment'),(46,'Can change class student enrollment',12,'change_classstudentenrollment'),(47,'Can delete class student enrollment',12,'delete_classstudentenrollment'),(48,'Can view class student enrollment',12,'view_classstudentenrollment'),(49,'Can add class teacher assignment',13,'add_classteacherassignment'),(50,'Can change class teacher assignment',13,'change_classteacherassignment'),(51,'Can delete class teacher assignment',13,'delete_classteacherassignment'),(52,'Can view class teacher assignment',13,'view_classteacherassignment'),(53,'Can add parent student relationship',14,'add_parentstudentrelationship'),(54,'Can change parent student relationship',14,'change_parentstudentrelationship'),(55,'Can delete parent student relationship',14,'delete_parentstudentrelationship'),(56,'Can view parent student relationship',14,'view_parentstudentrelationship'),(57,'Can add post',15,'add_post'),(58,'Can change post',15,'change_post'),(59,'Can delete post',15,'delete_post'),(60,'Can view post',15,'view_post'),(61,'Can add post attachment',16,'add_postattachment'),(62,'Can change post attachment',16,'change_postattachment'),(63,'Can delete post attachment',16,'delete_postattachment'),(64,'Can view post attachment',16,'view_postattachment'),(65,'Can add post comment',17,'add_postcomment'),(66,'Can change post comment',17,'change_postcomment'),(67,'Can delete post comment',17,'delete_postcomment'),(68,'Can view post comment',17,'view_postcomment'),(69,'Can add post like',18,'add_postlike'),(70,'Can change post like',18,'change_postlike'),(71,'Can delete post like',18,'delete_postlike'),(72,'Can view post like',18,'view_postlike'),(73,'Can add message thread',19,'add_messagethread'),(74,'Can change message thread',19,'change_messagethread'),(75,'Can delete message thread',19,'delete_messagethread'),(76,'Can view message thread',19,'view_messagethread'),(77,'Can add message',20,'add_message'),(78,'Can change message',20,'change_message'),(79,'Can delete message',20,'delete_message'),(80,'Can view message',20,'view_message'),(81,'Can add allowed message contact',21,'add_allowedmessagecontact'),(82,'Can change allowed message contact',21,'change_allowedmessagecontact'),(83,'Can delete allowed message contact',21,'delete_allowedmessagecontact'),(84,'Can view allowed message contact',21,'view_allowedmessagecontact'),(85,'Can add learning activity',22,'add_learningactivity'),(86,'Can change learning activity',22,'change_learningactivity'),(87,'Can delete learning activity',22,'delete_learningactivity'),(88,'Can view learning activity',22,'view_learningactivity'),(89,'Can add class learning session',23,'add_classlearningsession'),(90,'Can change class learning session',23,'change_classlearningsession'),(91,'Can delete class learning session',23,'delete_classlearningsession'),(92,'Can view class learning session',23,'view_classlearningsession'),(93,'Can add daily attendance',24,'add_dailyattendance'),(94,'Can change daily attendance',24,'change_dailyattendance'),(95,'Can delete daily attendance',24,'delete_dailyattendance'),(96,'Can view daily attendance',24,'view_dailyattendance'),(97,'Can add student learning record',25,'add_studentlearningrecord'),(98,'Can change student learning record',25,'change_studentlearningrecord'),(99,'Can delete student learning record',25,'delete_studentlearningrecord'),(100,'Can view student learning record',25,'view_studentlearningrecord'),(101,'Can add audit log',26,'add_auditlog'),(102,'Can change audit log',26,'change_auditlog'),(103,'Can delete audit log',26,'delete_auditlog'),(104,'Can view audit log',26,'view_auditlog'),(105,'Can add download log',27,'add_downloadlog'),(106,'Can change download log',27,'change_downloadlog'),(107,'Can delete download log',27,'delete_downloadlog'),(108,'Can view download log',27,'view_downloadlog'),(109,'Can add user session',28,'add_usersession'),(110,'Can change user session',28,'change_usersession'),(111,'Can delete user session',28,'delete_usersession'),(112,'Can view user session',28,'view_usersession');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `class_learning_sessions`
--

DROP TABLE IF EXISTS `class_learning_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_learning_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_date` date NOT NULL,
  `start_time` time(6) NOT NULL,
  `end_time` time(6) DEFAULT NULL,
  `duration_minutes` int unsigned DEFAULT NULL,
  `notes` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attendance_count` int unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `class_obj_id` bigint NOT NULL,
  `teacher_id` bigint NOT NULL,
  `activity_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `class_learning_sessions_class_obj_id_a0738692_fk_classes_id` (`class_obj_id`),
  KEY `class_learning_sessions_teacher_id_ad233235_fk_teachers_id` (`teacher_id`),
  KEY `class_learning_sessi_activity_id_bf2f2f3a_fk_learning_` (`activity_id`),
  CONSTRAINT `class_learning_sessi_activity_id_bf2f2f3a_fk_learning_` FOREIGN KEY (`activity_id`) REFERENCES `learning_activities` (`id`),
  CONSTRAINT `class_learning_sessions_class_obj_id_a0738692_fk_classes_id` FOREIGN KEY (`class_obj_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `class_learning_sessions_teacher_id_ad233235_fk_teachers_id` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`),
  CONSTRAINT `class_learning_sessions_chk_1` CHECK ((`duration_minutes` >= 0)),
  CONSTRAINT `class_learning_sessions_chk_2` CHECK ((`attendance_count` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_learning_sessions`
--

LOCK TABLES `class_learning_sessions` WRITE;
/*!40000 ALTER TABLE `class_learning_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `class_learning_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `class_student_enrollments`
--

DROP TABLE IF EXISTS `class_student_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_student_enrollments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `enrollment_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `class_obj_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_student_enrollments_class_obj_id_student_id_ff69571a_uniq` (`class_obj_id`,`student_id`),
  KEY `class_student_enrollments_student_id_5dd3a056_fk_students_id` (`student_id`),
  CONSTRAINT `class_student_enrollments_class_obj_id_5ad2bfd3_fk_classes_id` FOREIGN KEY (`class_obj_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `class_student_enrollments_student_id_5dd3a056_fk_students_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_student_enrollments`
--

LOCK TABLES `class_student_enrollments` WRITE;
/*!40000 ALTER TABLE `class_student_enrollments` DISABLE KEYS */;
/*!40000 ALTER TABLE `class_student_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `class_teacher_assignments`
--

DROP TABLE IF EXISTS `class_teacher_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_teacher_assignments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `class_obj_id` bigint NOT NULL,
  `teacher_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_teacher_assignment_class_obj_id_teacher_id__a1c716ea_uniq` (`class_obj_id`,`teacher_id`,`role`),
  KEY `class_teacher_assignments_teacher_id_b7c43f9c_fk_teachers_id` (`teacher_id`),
  CONSTRAINT `class_teacher_assignments_class_obj_id_bc52be73_fk_classes_id` FOREIGN KEY (`class_obj_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `class_teacher_assignments_teacher_id_b7c43f9c_fk_teachers_id` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_teacher_assignments`
--

LOCK TABLES `class_teacher_assignments` WRITE;
/*!40000 ALTER TABLE `class_teacher_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `class_teacher_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `class_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `class_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `age_group` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int unsigned NOT NULL,
  `room_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_code` (`class_code`),
  CONSTRAINT `classes_chk_1` CHECK ((`capacity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_attendance`
--

DROP TABLE IF EXISTS `daily_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_attendance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attendance_date` date NOT NULL,
  `check_in_time` time(6) DEFAULT NULL,
  `check_out_time` time(6) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `class_obj_id` bigint NOT NULL,
  `marked_by_teacher_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `daily_attendance_class_obj_id_student_id__73050d54_uniq` (`class_obj_id`,`student_id`,`attendance_date`),
  KEY `daily_attendance_marked_by_teacher_id_ece7d670_fk_teachers_id` (`marked_by_teacher_id`),
  KEY `daily_attendance_student_id_fe3c6606_fk_students_id` (`student_id`),
  KEY `idx_attendance_date_class` (`attendance_date`,`class_obj_id`),
  CONSTRAINT `daily_attendance_class_obj_id_53933f17_fk_classes_id` FOREIGN KEY (`class_obj_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `daily_attendance_marked_by_teacher_id_ece7d670_fk_teachers_id` FOREIGN KEY (`marked_by_teacher_id`) REFERENCES `teachers` (`id`),
  CONSTRAINT `daily_attendance_student_id_fe3c6606_fk_students_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_attendance`
--

LOCK TABLES `daily_attendance` WRITE;
/*!40000 ALTER TABLE `daily_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_users_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(4,'contenttypes','contenttype'),(8,'core','admin'),(21,'core','allowedmessagecontact'),(26,'core','auditlog'),(10,'core','class'),(23,'core','classlearningsession'),(12,'core','classstudentenrollment'),(13,'core','classteacherassignment'),(24,'core','dailyattendance'),(27,'core','downloadlog'),(22,'core','learningactivity'),(20,'core','message'),(19,'core','messagethread'),(9,'core','parent'),(14,'core','parentstudentrelationship'),(15,'core','post'),(16,'core','postattachment'),(17,'core','postcomment'),(18,'core','postlike'),(11,'core','student'),(25,'core','studentlearningrecord'),(7,'core','teacher'),(6,'core','user'),(28,'core','usersession'),(5,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2025-08-12 07:57:44.046902'),(2,'contenttypes','0002_remove_content_type_name','2025-08-12 07:57:44.071300'),(3,'auth','0001_initial','2025-08-12 07:57:44.141375'),(4,'auth','0002_alter_permission_name_max_length','2025-08-12 07:57:44.157156'),(5,'auth','0003_alter_user_email_max_length','2025-08-12 07:57:44.159780'),(6,'auth','0004_alter_user_username_opts','2025-08-12 07:57:44.162421'),(7,'auth','0005_alter_user_last_login_null','2025-08-12 07:57:44.164562'),(8,'auth','0006_require_contenttypes_0002','2025-08-12 07:57:44.164950'),(9,'auth','0007_alter_validators_add_error_messages','2025-08-12 07:57:44.167275'),(10,'auth','0008_alter_user_username_max_length','2025-08-12 07:57:44.169973'),(11,'auth','0009_alter_user_last_name_max_length','2025-08-12 07:57:44.171954'),(12,'auth','0010_alter_group_name_max_length','2025-08-12 07:57:44.176599'),(13,'auth','0011_update_proxy_permissions','2025-08-12 07:57:44.178690'),(14,'auth','0012_alter_user_first_name_max_length','2025-08-12 07:57:44.180810'),(15,'core','0001_create_user_model','2025-08-12 07:57:44.265130'),(16,'admin','0001_initial','2025-08-12 07:57:44.304678'),(17,'admin','0002_logentry_remove_auto_add','2025-08-12 07:57:44.310220'),(18,'admin','0003_logentry_add_action_flag_choices','2025-08-12 07:57:44.315220'),(19,'core','0002_create_teacher_model','2025-08-12 07:57:44.341864'),(20,'core','0003_create_parent_admin_models','2025-08-12 07:57:44.389144'),(21,'core','0004_create_class_student_models','2025-08-12 07:57:44.401337'),(22,'core','0005_create_relationship_models','2025-08-12 07:57:44.507781'),(23,'core','0006_create_posts_system','2025-08-12 07:57:44.651489'),(24,'core','0007_create_messaging_system','2025-08-12 07:57:44.810010'),(25,'core','0008_create_attendance_learning_models','2025-08-12 07:57:44.959969'),(26,'core','0009_create_system_models','2025-08-12 07:57:45.036045'),(27,'core','0010_populate_learning_activities','2025-08-12 07:57:45.052951'),(28,'core','0011_add_custom_indexes','2025-08-12 08:07:18.575715'),(29,'sessions','0001_initial','2025-08-12 08:07:18.584926');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `download_logs`
--

DROP TABLE IF EXISTS `download_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `download_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `downloaded_item_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `downloaded_item_id` bigint unsigned NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` char(39) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disclaimer_accepted` tinyint(1) NOT NULL,
  `download_purpose` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `download_logs_user_id_5d2e7f34_fk_users_id` (`user_id`),
  CONSTRAINT `download_logs_user_id_5d2e7f34_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `download_logs_chk_1` CHECK ((`downloaded_item_id` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `download_logs`
--

LOCK TABLES `download_logs` WRITE;
/*!40000 ALTER TABLE `download_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `download_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `learning_activities`
--

DROP TABLE IF EXISTS `learning_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learning_activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activity_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `age_group` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_minutes` int unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `learning_activities_chk_1` CHECK ((`duration_minutes` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `learning_activities`
--

LOCK TABLES `learning_activities` WRITE;
/*!40000 ALTER TABLE `learning_activities` DISABLE KEYS */;
INSERT INTO `learning_activities` VALUES (1,'Circle Time','Morning circle time for sharing and discussion','social','3-5 years',30,1,'2025-08-12 07:57:45.049847','2025-08-12 07:57:45.049856'),(2,'Story Reading','Reading stories to develop literacy skills','literacy','3-5 years',20,1,'2025-08-12 07:57:45.050474','2025-08-12 07:57:45.050483'),(3,'Number Games','Fun games to learn basic counting and numbers','numeracy','3-5 years',25,1,'2025-08-12 07:57:45.051080','2025-08-12 07:57:45.051086'),(4,'Art and Craft','Creative activities using various materials','art','3-5 years',45,1,'2025-08-12 07:57:45.051619','2025-08-12 07:57:45.051625'),(5,'Outdoor Play','Physical activities in the playground','physical','3-5 years',30,1,'2025-08-12 07:57:45.052387','2025-08-12 07:57:45.052393');
/*!40000 ALTER TABLE `learning_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_threads`
--

DROP TABLE IF EXISTS `message_threads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_threads` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `thread_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `participant1_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `participant2_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_message_at` datetime(6) DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `last_message_by_user_id` bigint DEFAULT NULL,
  `participant1_user_id` bigint NOT NULL,
  `participant2_user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `thread_id` (`thread_id`),
  KEY `message_threads_last_message_by_user_id_cda9ee5f_fk_users_id` (`last_message_by_user_id`),
  KEY `message_threads_participant1_user_id_6107aafe_fk_users_id` (`participant1_user_id`),
  KEY `message_threads_participant2_user_id_ca8ba616_fk_users_id` (`participant2_user_id`),
  CONSTRAINT `message_threads_last_message_by_user_id_cda9ee5f_fk_users_id` FOREIGN KEY (`last_message_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `message_threads_participant1_user_id_6107aafe_fk_users_id` FOREIGN KEY (`participant1_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `message_threads_participant2_user_id_ca8ba616_fk_users_id` FOREIGN KEY (`participant2_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_threads`
--

LOCK TABLES `message_threads` WRITE;
/*!40000 ALTER TABLE `message_threads` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_threads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `message_text` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `recipient_user_id` bigint NOT NULL,
  `sender_user_id` bigint NOT NULL,
  `thread_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_recipient_user_id_5183614c_fk_users_id` (`recipient_user_id`),
  KEY `messages_sender_user_id_b1b10099_fk_users_id` (`sender_user_id`),
  KEY `messages_thread_id_637cedbf_fk_message_threads_id` (`thread_id`),
  CONSTRAINT `messages_recipient_user_id_5183614c_fk_users_id` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `messages_sender_user_id_b1b10099_fk_users_id` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `messages_thread_id_637cedbf_fk_message_threads_id` FOREIGN KEY (`thread_id`) REFERENCES `message_threads` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parent_student_relationships`
--

DROP TABLE IF EXISTS `parent_student_relationships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_student_relationships` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `relationship_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_primary_contact` tinyint(1) NOT NULL,
  `pickup_authorized` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `parent_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `parent_student_relationships_parent_id_student_id_4c3a664f_uniq` (`parent_id`,`student_id`),
  KEY `parent_student_relationships_student_id_c4d726f7_fk_students_id` (`student_id`),
  CONSTRAINT `parent_student_relationships_parent_id_ab38b912_fk_parents_id` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`),
  CONSTRAINT `parent_student_relationships_student_id_c4d726f7_fk_students_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parent_student_relationships`
--

LOCK TABLES `parent_student_relationships` WRITE;
/*!40000 ALTER TABLE `parent_student_relationships` DISABLE KEYS */;
/*!40000 ALTER TABLE `parent_student_relationships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parents`
--

DROP TABLE IF EXISTS `parents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `occupation` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emergency_contact` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `parents_user_id_e07e9a2e_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parents`
--

LOCK TABLES `parents` WRITE;
/*!40000 ALTER TABLE `parents` DISABLE KEYS */;
/*!40000 ALTER TABLE `parents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_attachments`
--

DROP TABLE IF EXISTS `post_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_attachments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint unsigned DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `post_id` bigint NOT NULL,
  `uploaded_by_user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `post_attachments_post_id_6081d250_fk_posts_id` (`post_id`),
  KEY `post_attachments_uploaded_by_user_id_e542e2f3_fk_users_id` (`uploaded_by_user_id`),
  CONSTRAINT `post_attachments_post_id_6081d250_fk_posts_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `post_attachments_uploaded_by_user_id_e542e2f3_fk_users_id` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `post_attachments_chk_1` CHECK ((`file_size` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_attachments`
--

LOCK TABLES `post_attachments` WRITE;
/*!40000 ALTER TABLE `post_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comment_text` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `post_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `post_comments_post_id_e17f8125_fk_posts_id` (`post_id`),
  KEY `post_comments_user_id_540f5634_fk_users_id` (`user_id`),
  CONSTRAINT `post_comments_post_id_e17f8125_fk_posts_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `post_comments_user_id_540f5634_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `post_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_likes_post_id_user_id_4a23d35f_uniq` (`post_id`,`user_id`),
  KEY `post_likes_user_id_12e60720_fk_users_id` (`user_id`),
  CONSTRAINT `post_likes_post_id_b7e609e3_fk_posts_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `post_likes_user_id_12e60720_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `author_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `post_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `visibility` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_featured` tinyint(1) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `author_user_id` bigint NOT NULL,
  `target_class_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `posts_author_user_id_5558edf5_fk_users_id` (`author_user_id`),
  KEY `posts_target_class_id_b257b5e0_fk_classes_id` (`target_class_id`),
  KEY `idx_posts_created_featured` (`created_at`,`is_featured`,`is_deleted`),
  CONSTRAINT `posts_author_user_id_5558edf5_fk_users_id` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `posts_target_class_id_b257b5e0_fk_classes_id` FOREIGN KEY (`target_class_id`) REFERENCES `classes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_learning_records`
--

DROP TABLE IF EXISTS `student_learning_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_learning_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `was_present` tinyint(1) NOT NULL,
  `participation_level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `individual_notes` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `class_session_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_learning_records_student_id_class_session_4e86228f_uniq` (`student_id`,`class_session_id`),
  KEY `student_learning_rec_class_session_id_124e2504_fk_class_lea` (`class_session_id`),
  CONSTRAINT `student_learning_rec_class_session_id_124e2504_fk_class_lea` FOREIGN KEY (`class_session_id`) REFERENCES `class_learning_sessions` (`id`),
  CONSTRAINT `student_learning_records_student_id_56caac62_fk_students_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_learning_records`
--

LOCK TABLES `student_learning_records` WRITE;
/*!40000 ALTER TABLE `student_learning_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_learning_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `medical_conditions` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`),
  FULLTEXT KEY `student_name` (`student_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qualification` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `experience_years` int unsigned NOT NULL,
  `hire_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `teachers_user_id_6fdcda53_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `teachers_chk_1` CHECK ((`experience_years` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` char(39) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `user_sessions_user_id_43ce9642_fk_users_id` (`user_id`),
  CONSTRAINT `user_sessions_user_id_43ce9642_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `preferred_language` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'pbkdf2_sha256$1000000$YLuKtPpuGoMzf1arJs7qza$i0jXfDqF6TiHUiFfAd3NrPLPA09OnhoMtgcB2vAnd0k=',NULL,1,'superuser','','','b.yapabmmv@gmail.com',1,1,'2025-08-12 08:12:55.944474','','','en');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_groups`
--

DROP TABLE IF EXISTS `users_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_groups_user_id_group_id_fc7788e8_uniq` (`user_id`,`group_id`),
  KEY `users_groups_group_id_2f3517aa_fk_auth_group_id` (`group_id`),
  CONSTRAINT `users_groups_group_id_2f3517aa_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `users_groups_user_id_f500bee5_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_groups`
--

LOCK TABLES `users_groups` WRITE;
/*!40000 ALTER TABLE `users_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `users_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_user_permissions`
--

DROP TABLE IF EXISTS `users_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_user_permissions_user_id_permission_id_3b86cbdf_uniq` (`user_id`,`permission_id`),
  KEY `users_user_permissio_permission_id_6d08dcd2_fk_auth_perm` (`permission_id`),
  CONSTRAINT `users_user_permissio_permission_id_6d08dcd2_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `users_user_permissions_user_id_92473840_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_user_permissions`
--

LOCK TABLES `users_user_permissions` WRITE;
/*!40000 ALTER TABLE `users_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `users_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-17 12:47:01
