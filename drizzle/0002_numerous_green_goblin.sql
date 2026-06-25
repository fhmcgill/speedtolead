ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` varchar(32) DEFAULT 'inactive';