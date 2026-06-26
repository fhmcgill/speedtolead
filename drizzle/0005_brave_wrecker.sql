ALTER TABLE `followup_templates` MODIFY COLUMN `forbiddenPhrases` json;--> statement-breakpoint
ALTER TABLE `leads` ADD `externalId` varchar(255);--> statement-breakpoint
ALTER TABLE `messages` ADD `externalId` varchar(255);--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_externalId_unique` UNIQUE(`externalId`);--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_externalId_unique` UNIQUE(`externalId`);