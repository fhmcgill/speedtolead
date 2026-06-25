CREATE TABLE `estimate_followup_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`leadId` int,
	`templateId` int NOT NULL,
	`variantId` int,
	`attemptNumber` int NOT NULL,
	`estimateId` varchar(128),
	`customerName` varchar(255),
	`customerPhone` varchar(32),
	`estimateAmount` varchar(32),
	`serviceDescription` text,
	`generatedMessage` text,
	`status` enum('pending_approval','approved','sent','rejected','failed') NOT NULL DEFAULT 'pending_approval',
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`smsLogId` int,
	`resultedInBooking` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `estimate_followup_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `followup_ab_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`variantLabel` varchar(4) NOT NULL,
	`promptInstructions` text NOT NULL,
	`sendCount` int DEFAULT 0,
	`bookingCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `followup_ab_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `followup_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`attemptNumber` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`promptInstructions` text NOT NULL,
	`tone` enum('friendly','professional','urgent') DEFAULT 'friendly',
	`maxChars` int DEFAULT 320,
	`forbiddenPhrases` json DEFAULT ('[]'),
	`approvalRequired` boolean DEFAULT false,
	`delayHours` int DEFAULT 24,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `followup_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `messaging_settings` MODIFY COLUMN `optOutKeywords` json;--> statement-breakpoint
ALTER TABLE `messaging_settings` MODIFY COLUMN `optedOutNumbers` json;