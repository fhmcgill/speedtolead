import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, bigint } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
   lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionPlan: varchar("subscriptionPlan", { length: 64 }),
  subscriptionStatus: varchar("subscriptionStatus", { length: 32 }).default("inactive"),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Businesses ──────────────────────────────────────────────────────────────
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  serviceCategories: json("serviceCategories").$type<string[]>().default([]),
  workingHours: json("workingHours").$type<Record<string, { start: string; end: string; enabled: boolean }>>(),
  timezone: varchar("timezone", { length: 64 }).default("America/New_York"),
  aiContext: text("aiContext"),
  aiTone: varchar("aiTone", { length: 32 }).default("professional"),
  aiPromptInstructions: text("aiPromptInstructions"),
  aiResponseRules: json("aiResponseRules").$type<string[]>().default([]),
  aiUnsupportedReply: text("aiUnsupportedReply"),
  availabilityMode: mysqlEnum("availabilityMode", ["manual", "servicetitan", "jobber"]).default("manual"),
  serviceTitanConfig: json("serviceTitanConfig").$type<{ tenantId?: string; clientId?: string; clientSecret?: string }>(),
  jobberConfig: json("jobberConfig").$type<{ accessToken?: string; refreshToken?: string }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

// ─── Availability Slots (manual mode) ────────────────────────────────────────
export const availabilitySlots = mysqlTable("availability_slots", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sun, 6=Sat
  startTime: varchar("startTime", { length: 8 }).notNull(), // "09:00"
  endTime: varchar("endTime", { length: 8 }).notNull(), // "17:00"
  maxBookings: int("maxBookings").default(5),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = typeof availabilitySlots.$inferInsert;

// ─── Team Members ────────────────────────────────────────────────────────────
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  role: mysqlEnum("role", ["owner", "team_member"]).default("team_member").notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ─── Lead Sources (integrations) ─────────────────────────────────────────────
export const leadSources = mysqlTable("lead_sources", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  sourceType: mysqlEnum("sourceType", ["yelp", "thumbtack", "google_lsa", "website", "manual"]).notNull(),
  isConnected: boolean("isConnected").default(false),
  config: json("config").$type<Record<string, string>>(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadSource = typeof leadSources.$inferSelect;
export type InsertLeadSource = typeof leadSources.$inferInsert;

// ─── Leads ───────────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  sourceType: mysqlEnum("sourceType", ["yelp", "thumbtack", "google_lsa", "website", "manual"]).default("manual"),
  // External system's unique ID for this lead (e.g. a Google Ads LocalServicesLead
  // resource name). Used to dedupe re-synced leads from polling-based integrations.
  // Null for manually-created/website leads that have no external source.
  externalId: varchar("externalId", { length: 255 }).unique(),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  serviceNeeded: text("serviceNeeded"),
  status: mysqlEnum("status", ["new", "qualified", "booked", "lost"]).default("new").notNull(),
  assignedToId: int("assignedToId"),
  aiActive: boolean("aiActive").default(true),
  responseTimeMs: bigint("responseTimeMs", { mode: "number" }),
  bookedAt: timestamp("bookedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Conversations ───────────────────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  businessId: int("businessId").notNull(),
  channel: varchar("channel", { length: 32 }).default("website"),
  aiActive: boolean("aiActive").default(true),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── Messages ────────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderType: mysqlEnum("senderType", ["customer", "ai", "team_member"]).notNull(),
  senderId: int("senderId"),
  content: text("content").notNull(),
  // External system's unique ID for this message (e.g. a Google Ads
  // LocalServicesLeadConversation id). Used to avoid re-inserting the same
  // message on every poll. Null for messages created natively in this app.
  externalId: varchar("externalId", { length: 255 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Follow-Up Sequences ─────────────────────────────────────────────────────
export const followUpSequences = mysqlTable("follow_up_sequences", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true),
  steps: json("steps").$type<Array<{ delayMinutes: number; messageTemplate: string }>>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowUpSequence = typeof followUpSequences.$inferSelect;
export type InsertFollowUpSequence = typeof followUpSequences.$inferInsert;

// ─── Follow-Up Tasks (scheduled follow-ups for individual leads) ─────────────
export const followUpTasks = mysqlTable("follow_up_tasks", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  sequenceId: int("sequenceId").notNull(),
  stepIndex: int("stepIndex").default(0),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "cancelled"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FollowUpTask = typeof followUpTasks.$inferSelect;
export type InsertFollowUpTask = typeof followUpTasks.$inferInsert;

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  businessId: int("businessId").notNull(),
  scheduledDate: varchar("scheduledDate", { length: 10 }).notNull(), // "2026-04-25"
  scheduledTime: varchar("scheduledTime", { length: 8 }).notNull(), // "09:00"
  serviceType: varchar("serviceType", { length: 255 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["confirmed", "completed", "cancelled"]).default("confirmed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ─── SMS Logs ────────────────────────────────────────────────────────────────
export const smsLogs = mysqlTable("sms_logs", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  leadId: int("leadId"),
  conversationId: int("conversationId"),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).notNull(),
  toNumber: varchar("toNumber", { length: 32 }).notNull(),
  fromNumber: varchar("fromNumber", { length: 32 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["queued", "sent", "delivered", "failed", "undelivered"]).default("queued").notNull(),
  plivoMessageUuid: varchar("plivoMessageUuid", { length: 128 }),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmsLog = typeof smsLogs.$inferSelect;
export type InsertSmsLog = typeof smsLogs.$inferInsert;

// ─── Messaging Settings ───────────────────────────────────────────────────────
export const messagingSettings = mysqlTable("messaging_settings", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().unique(),
  smsEnabled: boolean("smsEnabled").default(false),
  fromNumber: varchar("fromNumber", { length: 32 }),
  optOutKeywords: json("optOutKeywords").$type<string[]>(),
  optedOutNumbers: json("optedOutNumbers").$type<string[]>(),
  dailySendLimit: int("dailySendLimit").default(200),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MessagingSettings = typeof messagingSettings.$inferSelect;
export type InsertMessagingSettings = typeof messagingSettings.$inferInsert;

// ─── Estimate Follow-Up Templates ────────────────────────────────────────────
// One row per attempt number per business. Owners coach the AI here.
export const followupTemplates = mysqlTable("followup_templates", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  attemptNumber: int("attemptNumber").notNull(), // 1, 2, 3
  name: varchar("name", { length: 255 }).notNull(), // e.g. "First Nudge"
  promptInstructions: text("promptInstructions").notNull(), // coaching text for the LLM
  tone: mysqlEnum("tone", ["friendly", "professional", "urgent"]).default("friendly"),
  maxChars: int("maxChars").default(320),
  forbiddenPhrases: json("forbiddenPhrases").$type<string[]>(),
  approvalRequired: boolean("approvalRequired").default(false),
  delayHours: int("delayHours").default(24), // hours after estimate sent before this attempt fires
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowupTemplate = typeof followupTemplates.$inferSelect;
export type InsertFollowupTemplate = typeof followupTemplates.$inferInsert;

// ─── A/B Variants per Template ───────────────────────────────────────────────
export const followupAbVariants = mysqlTable("followup_ab_variants", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  variantLabel: varchar("variantLabel", { length: 4 }).notNull(), // "A" or "B"
  promptInstructions: text("promptInstructions").notNull(),
  sendCount: int("sendCount").default(0),
  bookingCount: int("bookingCount").default(0), // conversions attributed to this variant
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowupAbVariant = typeof followupAbVariants.$inferSelect;
export type InsertFollowupAbVariant = typeof followupAbVariants.$inferInsert;

// ─── Estimate Follow-Up Queue ─────────────────────────────────────────────────
// Tracks each follow-up attempt for each estimate. Approval queue lives here.
export const estimateFollowupQueue = mysqlTable("estimate_followup_queue", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  leadId: int("leadId"),
  templateId: int("templateId").notNull(),
  variantId: int("variantId"), // null = no A/B, use template directly
  attemptNumber: int("attemptNumber").notNull(),
  estimateId: varchar("estimateId", { length: 128 }), // ServiceTitan estimate ID
  customerName: varchar("customerName", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  estimateAmount: varchar("estimateAmount", { length: 32 }),
  serviceDescription: text("serviceDescription"),
  generatedMessage: text("generatedMessage"), // AI-drafted message
  status: mysqlEnum("status", ["pending_approval", "approved", "sent", "rejected", "failed"]).default("pending_approval").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  sentAt: timestamp("sentAt"),
  smsLogId: int("smsLogId"),
  resultedInBooking: boolean("resultedInBooking").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EstimateFollowupQueue = typeof estimateFollowupQueue.$inferSelect;
export type InsertEstimateFollowupQueue = typeof estimateFollowupQueue.$inferInsert;
