CREATE TABLE `messaging_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`smsEnabled` boolean DEFAULT false,
	`fromNumber` varchar(32),
	`optOutKeywords` json DEFAULT ('["STOP","UNSUBSCRIBE","QUIT","CANCEL","END"]'),
	`optedOutNumbers` json DEFAULT ('[]'),
	`dailySendLimit` int DEFAULT 200,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messaging_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `messaging_settings_businessId_unique` UNIQUE(`businessId`)
);
--> statement-breakpoint
CREATE TABLE `sms_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`leadId` int,
	`conversationId` int,
	`direction` enum('outbound','inbound') NOT NULL,
	`toNumber` varchar(32) NOT NULL,
	`fromNumber` varchar(32) NOT NULL,
	`body` text NOT NULL,
	`status` enum('queued','sent','delivered','failed','undelivered') NOT NULL DEFAULT 'queued',
	`plivoMessageUuid` varchar(128),
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_logs_id` PRIMARY KEY(`id`)
);
