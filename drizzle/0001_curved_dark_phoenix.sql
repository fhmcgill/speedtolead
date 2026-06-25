CREATE TABLE `availability_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(8) NOT NULL,
	`endTime` varchar(8) NOT NULL,
	`maxBookings` int DEFAULT 5,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `availability_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`businessId` int NOT NULL,
	`scheduledDate` varchar(10) NOT NULL,
	`scheduledTime` varchar(8) NOT NULL,
	`serviceType` varchar(255),
	`notes` text,
	`status` enum('confirmed','completed','cancelled') DEFAULT 'confirmed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(32),
	`email` varchar(320),
	`address` text,
	`serviceCategories` json DEFAULT ('[]'),
	`workingHours` json,
	`timezone` varchar(64) DEFAULT 'America/New_York',
	`aiContext` text,
	`aiTone` varchar(32) DEFAULT 'professional',
	`aiPromptInstructions` text,
	`aiResponseRules` json DEFAULT ('[]'),
	`aiUnsupportedReply` text,
	`availabilityMode` enum('manual','servicetitan','jobber') DEFAULT 'manual',
	`serviceTitanConfig` json,
	`jobberConfig` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`businessId` int NOT NULL,
	`channel` varchar(32) DEFAULT 'website',
	`aiActive` boolean DEFAULT true,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follow_up_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`isActive` boolean DEFAULT true,
	`steps` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `follow_up_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follow_up_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`sequenceId` int NOT NULL,
	`stepIndex` int DEFAULT 0,
	`scheduledAt` timestamp NOT NULL,
	`status` enum('pending','sent','cancelled') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follow_up_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`sourceType` enum('yelp','thumbtack','google_lsa','website','manual') NOT NULL,
	`isConnected` boolean DEFAULT false,
	`config` json,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`sourceType` enum('yelp','thumbtack','google_lsa','website','manual') DEFAULT 'manual',
	`customerName` varchar(255),
	`customerEmail` varchar(320),
	`customerPhone` varchar(32),
	`serviceNeeded` text,
	`status` enum('new','qualified','booked','lost') NOT NULL DEFAULT 'new',
	`assignedToId` int,
	`aiActive` boolean DEFAULT true,
	`responseTimeMs` bigint,
	`bookedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderType` enum('customer','ai','team_member') NOT NULL,
	`senderId` int,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`role` enum('owner','team_member') NOT NULL DEFAULT 'team_member',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
