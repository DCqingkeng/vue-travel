-- MySQL dump 10.13  Distrib 5.7.36, for Win64 (x86_64)
--
-- Host: localhost    Database: travel
-- ------------------------------------------------------
-- Server version	5.7.36-log

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
-- Table structure for table `destination`
--

DROP TABLE IF EXISTS `destination`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `destination` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '名称',
  `type` enum('SCENIC_SPOT','SCHOOL') NOT NULL COMMENT '类型',
  `heat_score` double DEFAULT '0' COMMENT '热度',
  `rating` double DEFAULT NULL COMMENT '用户平均评分（1-5分）',
  `latitude` double NOT NULL COMMENT '纬度',
  `longitude` double NOT NULL COMMENT '经度',
  `description` text COMMENT '描述',
  `keywords` varchar(255) DEFAULT NULL COMMENT '关键词',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_heat` (`heat_score`),
  FULLTEXT KEY `idx_fulltext` (`name`,`keywords`,`description`) /*!50100 WITH PARSER `ngram` */ 
) ENGINE=InnoDB AUTO_INCREMENT=203 DEFAULT CHARSET=utf8mb4 COMMENT='目的地表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `destination_interest`
--

DROP TABLE IF EXISTS `destination_interest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `destination_interest` (
  `destination_id` bigint(20) NOT NULL COMMENT '景点ID',
  `interest_tag` varchar(50) NOT NULL COMMENT '兴趣标签',
  `match_score` double DEFAULT '0' COMMENT '匹配度',
  PRIMARY KEY (`destination_id`,`interest_tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='景点兴趣匹配表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diary_media`
--

DROP TABLE IF EXISTS `diary_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `diary_media` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `diary_id` bigint(20) NOT NULL,
  `media_type` enum('IMAGE','VIDEO') NOT NULL,
  `media_url` varchar(500) NOT NULL,
  `sort_order` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_diary_id` (`diary_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diary_rating`
--

DROP TABLE IF EXISTS `diary_rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `diary_rating` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `diary_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `score` double NOT NULL COMMENT '1-5分',
  `comment` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_diary_user` (`diary_id`,`user_id`),
  KEY `idx_diary_id` (`diary_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diary_view`
--

DROP TABLE IF EXISTS `diary_view`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `diary_view` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `diary_id` bigint(20) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL COMMENT '可为null',
  `ip_address` varchar(50) DEFAULT NULL,
  `view_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_diary_id` (`diary_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `evacuation_record`
--

DROP TABLE IF EXISTS `evacuation_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `evacuation_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL COMMENT '疏散用户ID',
  `start_node_id` bigint(20) NOT NULL COMMENT '起点路网节点',
  `shelter_id` bigint(20) DEFAULT NULL COMMENT '目标避难所',
  `disaster_type` varchar(20) NOT NULL COMMENT 'FLOOD/ EARTHQUAKE/ FIRE',
  `intensity` double DEFAULT NULL COMMENT '灾害强度（雨量/震级/火级）',
  `route_json` json DEFAULT NULL COMMENT '实际路线节点序列',
  `estimated_time` int(11) DEFAULT NULL COMMENT '预估用时（秒）',
  `status` varchar(20) DEFAULT 'PLANNED' COMMENT 'PLANNED/ EVACUATING/ REACHED',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='疏散日志与复盘';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `food`
--

DROP TABLE IF EXISTS `food`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `food` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `restaurant_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `food_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1276 DEFAULT CHARSET=utf8mb4 COMMENT='美食信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `indoor_building`
--

DROP TABLE IF EXISTS `indoor_building`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `indoor_building` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination_id` bigint(20) DEFAULT NULL COMMENT '所属校区/景区ID',
  `address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `indoor_edge`
--

DROP TABLE IF EXISTS `indoor_edge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `indoor_edge` (
  `id` bigint(20) NOT NULL,
  `building_id` bigint(20) NOT NULL,
  `from_node_id` bigint(20) NOT NULL,
  `to_node_id` bigint(20) NOT NULL,
  `distance` double NOT NULL COMMENT '距离(米)',
  `edge_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'WALK-步行, ELEVATOR-电梯, STAIRS-楼梯',
  `time_cost` double DEFAULT NULL COMMENT '预估时间(秒)',
  `is_one_way` tinyint(4) DEFAULT '0' COMMENT '0-双向, 1-单向',
  `description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `indoor_node`
--

DROP TABLE IF EXISTS `indoor_node`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `indoor_node` (
  `id` bigint(20) NOT NULL,
  `building_id` bigint(20) NOT NULL,
  `floor` int(11) NOT NULL COMMENT '楼层：1=1F，2=2F，3=3F，4=4F',
  `node_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ENTRANCE-出入口, ELEVATOR-电梯, STAIRS-楼梯, ROOM-房间, CORNER-走廊拐角, HALL-大厅',
  `node_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '节点编码，如1F-EV1',
  `node_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pos_x` double DEFAULT NULL COMMENT '室内平面X坐标(米)',
  `pos_y` double DEFAULT NULL COMMENT '室内平面Y坐标(米)',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_edge`
--

DROP TABLE IF EXISTS `map_edge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_edge` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `destination_id` bigint(20) DEFAULT NULL COMMENT '所属学校/景区',
  `start_node_id` bigint(20) NOT NULL,
  `end_node_id` bigint(20) NOT NULL,
  `distance` decimal(10,2) NOT NULL,
  `weight` decimal(10,2) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `road_type` varchar(64) DEFAULT NULL,
  `one_way` tinyint(4) DEFAULT '0',
  `geometry` text,
  `congestion` double DEFAULT '1' COMMENT '道路拥挤度 0.0~1.0，1.0表示完全畅通',
  `elevation_start` double DEFAULT NULL COMMENT '起点海拔(米)',
  `elevation_end` double DEFAULT NULL COMMENT '终点海拔(米)',
  `slope` double DEFAULT '0' COMMENT '坡度(%), 正为上坡, 负为下坡',
  `terrain_type` varchar(20) DEFAULT 'FLAT' COMMENT '地势类型: FLAT(平地)/ LOWLAND(低洼)/ HILLSIDE(山坡)',
  `is_waterfront` tinyint(4) DEFAULT '0' COMMENT '是否临水/沿河/沿湖, 洪水关键指标',
  `is_underpass` tinyint(4) DEFAULT '0' COMMENT '是否下穿通道/隧道/地下过街, 室外低洼路段, 洪水关键',
  `population_density` double DEFAULT '0' COMMENT '周边静态人口密度(人/公顷), 基于POI加权估算',
  `building_density` double DEFAULT '0' COMMENT '周边建筑密度0-1, 地震时建筑密集区次生灾害风险高',
  `flood_risk_base` double DEFAULT '0' COMMENT '基础洪水风险0-1, 综合海拔+临水+下穿+低洼',
  `landslide_risk_base` double DEFAULT '0' COMMENT '基础滑坡/泥石流风险0-1, 综合坡度+山坡地势',
  PRIMARY KEY (`id`),
  KEY `idx_start` (`start_node_id`),
  KEY `idx_end` (`end_node_id`),
  KEY `fk_map_edge_destination` (`destination_id`),
  CONSTRAINT `fk_map_edge_destination` FOREIGN KEY (`destination_id`) REFERENCES `destination` (`id`),
  CONSTRAINT `map_edge_ibfk_1` FOREIGN KEY (`start_node_id`) REFERENCES `map_node` (`id`),
  CONSTRAINT `map_edge_ibfk_2` FOREIGN KEY (`end_node_id`) REFERENCES `map_node` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13653 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_node`
--

DROP TABLE IF EXISTS `map_node`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map_node` (
  `id` bigint(20) NOT NULL,
  `destination_id` bigint(20) DEFAULT NULL COMMENT '所属学校/景区',
  `longitude` decimal(10,7) NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_map_node_destination` (`destination_id`),
  CONSTRAINT `fk_map_node_destination` FOREIGN KEY (`destination_id`) REFERENCES `destination` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poi`
--

DROP TABLE IF EXISTS `poi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `destination_id` bigint(20) DEFAULT NULL COMMENT '所属学校/景区',
  `poi_name` varchar(255) NOT NULL,
  `category` varchar(128) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `nearest_node_id` bigint(20) DEFAULT NULL COMMENT '道路网上最近的节点ID',
  PRIMARY KEY (`id`),
  KEY `nearest_node_id` (`nearest_node_id`),
  KEY `fk_poi_destination` (`destination_id`),
  CONSTRAINT `fk_poi_destination` FOREIGN KEY (`destination_id`) REFERENCES `destination` (`id`),
  CONSTRAINT `poi_ibfk_1` FOREIGN KEY (`nearest_node_id`) REFERENCES `map_node` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=993 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `restaurant`
--

DROP TABLE IF EXISTS `restaurant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `restaurant` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `heat_score` int(11) DEFAULT '0',
  `rating` decimal(2,1) DEFAULT '5.0',
  `destination_id` bigint(20) NOT NULL,
  `cuisine_type` varchar(50) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `nearest_node_id` bigint(20) DEFAULT NULL COMMENT '最近的道路节点ID',
  PRIMARY KEY (`id`),
  KEY `destination_id` (`destination_id`),
  CONSTRAINT `restaurant_ibfk_1` FOREIGN KEY (`destination_id`) REFERENCES `destination` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=300 DEFAULT CHARSET=utf8mb4 COMMENT='餐厅信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shelter`
--

DROP TABLE IF EXISTS `shelter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shelter` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `destination_id` bigint(20) NOT NULL COMMENT '所属学校: 201/202/170',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '避难所名称，如东区体育场',
  `lat` double NOT NULL COMMENT '纬度',
  `lng` double NOT NULL COMMENT '经度',
  `shelter_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'FIRE_SHELTER/ EARTHQUAKE_SHELTER/ FLOOD_HIGH/ GENERAL',
  `capacity` int(11) NOT NULL DEFAULT '500' COMMENT '最大容纳人数',
  `current_occupancy` int(11) DEFAULT '0' COMMENT '当前已占用人数',
  `nearest_node_id` bigint(20) DEFAULT NULL COMMENT '最近路网节点ID，用于Dijkstra寻路',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'AVAILABLE' COMMENT 'AVAILABLE/ FULL/ DAMAGED',
  PRIMARY KEY (`id`),
  KEY `idx_destination` (`destination_id`,`shelter_type`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应急避难所资源库';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `travel_diary`
--

DROP TABLE IF EXISTS `travel_diary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `travel_diary` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT '作者ID',
  `destination_id` bigint(20) DEFAULT NULL COMMENT '关联目的地ID',
  `title` varchar(200) NOT NULL COMMENT '日记标题',
  `content` longtext COMMENT '日记内容（可能为压缩后二进制）',
  `content_compressed` tinyint(4) DEFAULT '0' COMMENT '是否压缩：0-原文，1-压缩',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '封面图URL',
  `heat_score` double DEFAULT '0' COMMENT '热度得分',
  `avg_rating` double DEFAULT '5' COMMENT '平均评分',
  `rating_count` int(11) DEFAULT '0' COMMENT '评分人数',
  `keywords` varchar(500) DEFAULT NULL COMMENT '关键词标签，逗号分隔',
  `travel_date` date DEFAULT NULL COMMENT '旅游日期',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_destination_id` (`destination_id`),
  KEY `idx_heat_score` (`heat_score`),
  FULLTEXT KEY `ft_title` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COMMENT='旅游日记表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '登录账号',
  `password` varchar(100) NOT NULL COMMENT 'BCrypt加密后的密码',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_interest`
--

DROP TABLE IF EXISTS `user_interest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_interest` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `interest_tag` varchar(50) NOT NULL COMMENT '兴趣标签',
  `weight` double DEFAULT '1' COMMENT '权重',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_tag` (`user_id`,`interest_tag`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COMMENT='用户兴趣表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-20 19:38:32
